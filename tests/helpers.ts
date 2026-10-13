import type { PluginContext } from "emdash";
import sharp from "sharp";

import type { PluginMediaItem } from "../src/convert.js";

interface StoredMedia {
	item: PluginMediaItem;
	bytes: Uint8Array;
}

/** In-memory versioned map with the KV / storage CAS contract. */
class VersionedMap {
	readonly data = new Map<string, { value: unknown; revision: string }>();
	private rev = 0;

	get<T>(key: string): T | null {
		return (this.data.get(key)?.value as T) ?? null;
	}
	getVersioned<T>(key: string) {
		const entry = this.data.get(key);
		return entry ? { value: structuredClone(entry.value) as T, revision: entry.revision } : null;
	}
	set(key: string, value: unknown): void {
		this.data.set(key, { value: structuredClone(value), revision: String(++this.rev) });
	}
	compareAndSet(key: string, expected: string | null, value: unknown) {
		const current = this.data.get(key);
		if ((current?.revision ?? null) !== expected) return { applied: false as const };
		this.set(key, value);
		return { applied: true as const, revision: this.data.get(key)!.revision };
	}
	delete(key: string): boolean {
		return this.data.delete(key);
	}
}

function matches(data: Record<string, unknown>, where?: Record<string, unknown>): boolean {
	return Object.entries(where ?? {}).every(([k, v]) => data[k] === v);
}

export function createTestContext(options: { settings?: Record<string, unknown> } = {}) {
	const media = new Map<string, StoredMedia>();
	const uploads: Array<{ id: string; filename: string; mimeType: string; bytes: Uint8Array }> = [];
	const metadataUpdates: Array<{ id: string; patch: Record<string, unknown> }> = [];
	const kv = new VersionedMap();
	const settings = new VersionedMap();
	const conversions = new VersionedMap();
	const cronTasks = new Map<string, string>();
	const logs: Array<{ level: string; message: string; data?: unknown }> = [];
	let nextId = 1;

	for (const [key, value] of Object.entries(options.settings ?? {})) settings.set(key, value);

	const addMedia = (filename: string, mimeType: string, bytes: Uint8Array, extra: Partial<PluginMediaItem> = {}) => {
		const id = `m${String(nextId++).padStart(4, "0")}`;
		const item: PluginMediaItem = {
			id,
			filename,
			mimeType,
			size: bytes.byteLength,
			url: `/media/${id}/${filename}`,
			createdAt: new Date().toISOString(),
			status: "ready",
			...extra,
		};
		media.set(id, { item, bytes });
		return item;
	};

	const log = (level: string) => (message: string, data?: unknown) => {
		logs.push({ level, message, data });
	};

	const ctx = {
		plugin: { id: "image-convert", version: "0.0.0" },
		log: { debug: log("debug"), info: log("info"), warn: log("warn"), error: log("error") },
		site: { name: "Test", url: "http://localhost", locale: "en" },
		url: (path: string) => `http://localhost${path}`,
		kv: {
			get: async <T>(key: string) => kv.get<T>(key),
			getVersioned: async <T>(key: string) => kv.getVersioned<T>(key),
			compareAndSet: async (key: string, rev: string | null, value: unknown) => kv.compareAndSet(key, rev, value),
			compareAndDelete: async () => ({ applied: false }),
			set: async (key: string, value: unknown) => kv.set(key, value),
			delete: async (key: string) => kv.delete(key),
			list: async () => [],
		},
		settings: {
			get: async <T>(key: string) => settings.get<T>(key),
			getVersioned: async <T>(key: string) => settings.getVersioned<T>(key),
			compareAndSet: async (key: string, rev: string | null, value: unknown) =>
				settings.compareAndSet(key, rev, value),
			compareAndDelete: async () => ({ applied: false }),
			set: async (key: string, value: unknown) => settings.set(key, value),
			delete: async (key: string) => settings.delete(key),
			list: async () => [],
		},
		storage: {
			conversions: {
				get: async (id: string) => conversions.get(id),
				put: async (id: string, data: unknown) => conversions.set(id, data),
				getVersioned: async (id: string) => conversions.getVersioned(id),
				compareAndSet: async (id: string, rev: string | null, data: unknown) =>
					conversions.compareAndSet(id, rev, data),
				count: async (where?: Record<string, unknown>) =>
					[...conversions.data.values()].filter((e) => matches(e.value as Record<string, unknown>, where))
						.length,
				query: async (opts: { where?: Record<string, unknown>; limit?: number } = {}) => {
					const items = [...conversions.data.entries()]
						.map(([id, e]) => ({ id, data: e.value as Record<string, unknown> }))
						.filter((i) => matches(i.data, opts.where))
						.sort((a, b) => String(b.data.updatedAt).localeCompare(String(a.data.updatedAt)));
					return { items: items.slice(0, opts.limit ?? 50), hasMore: items.length > (opts.limit ?? 50) };
				},
			},
		},
		media: {
			get: async (id: string) => media.get(id)?.item ?? null,
			list: async (opts: { limit?: number; cursor?: string; mimeType?: string } = {}) => {
				const all = [...media.values()]
					.map((m) => m.item)
					.filter((i) => !opts.mimeType || i.mimeType.startsWith(opts.mimeType));
				const start = opts.cursor ? Number(opts.cursor) : 0;
				const limit = opts.limit ?? 50;
				const items = all.slice(start, start + limit);
				const hasMore = start + limit < all.length;
				return { items, hasMore, cursor: hasMore ? String(start + limit) : undefined };
			},
			readBytes: async (id: string, opts?: { maxBytes?: number }) => {
				const m = media.get(id);
				if (!m) throw new Error("not found");
				if (opts?.maxBytes && m.bytes.byteLength > opts.maxBytes) throw new Error("too large");
				return { bytes: m.bytes, filename: m.item.filename, mimeType: m.item.mimeType, size: m.bytes.byteLength };
			},
			upload: async (filename: string, mimeType: string, bytes: ArrayBuffer) => {
				const item = addMedia(filename, mimeType, new Uint8Array(bytes));
				uploads.push({ id: item.id, filename, mimeType, bytes: new Uint8Array(bytes) });
				return { mediaId: item.id, storageKey: `${item.id}.bin`, url: item.url };
			},
			updateMetadata: async (id: string, patch: Record<string, unknown>) => {
				metadataUpdates.push({ id, patch });
				const m = media.get(id)!;
				Object.assign(m.item, patch);
				return m.item;
			},
			getUploadUrl: async () => {
				throw new Error("unused");
			},
			delete: async (id: string) => media.delete(id),
		},
		cron: {
			schedule: async (name: string, opts: { schedule: string }) => {
				cronTasks.set(name, opts.schedule);
			},
			cancel: async (name: string) => {
				cronTasks.delete(name);
			},
			list: async () => [],
		},
	} as unknown as PluginContext;

	return { ctx, media, uploads, metadataUpdates, kv, settings, conversions, cronTasks, logs, addMedia };
}

/** A noisy photo-like JPEG so WebP/AVIF actually come out smaller. */
export async function makeJpeg(width = 320, height = 240): Promise<Uint8Array> {
	const raw = Buffer.alloc(width * height * 3);
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const i = (y * width + x) * 3;
			raw[i] = (x * 255) / width;
			raw[i + 1] = (y * 255) / height;
			raw[i + 2] = ((x + y) * 7) % 256;
		}
	}
	return new Uint8Array(
		await sharp(raw, { raw: { width, height, channels: 3 } }).jpeg({ quality: 95 }).toBuffer(),
	);
}

export async function makePng(width = 64, height = 64): Promise<Uint8Array> {
	return new Uint8Array(
		await sharp({
			create: { width, height, channels: 4, background: { r: 200, g: 50, b: 50, alpha: 0.5 } },
		})
			.png()
			.toBuffer(),
	);
}

export async function formatOf(bytes: Uint8Array): Promise<string | undefined> {
	return (await sharp(bytes).metadata()).format;
}
