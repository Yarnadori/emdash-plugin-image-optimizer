import type { PluginContext, StorageCollection } from "emdash";

import type { Encoder } from "./encoder.js";
import type { ConvertSettings, OutputFormat } from "./settings.js";
import { FORMAT_MIME } from "./settings.js";

/** Media item as returned by the plugin media API (`emdash` exports a different `MediaItem`). */
export type PluginMediaItem = NonNullable<
	Awaited<ReturnType<NonNullable<PluginContext["media"]>["get"]>>
>;

/** MIME types this plugin converts. GIF is excluded so animations are not flattened. */
export const SOURCE_MIME_TYPES: readonly string[] = ["image/jpeg", "image/png"];

/** The host refuses media byte reads above 16 MiB. */
export const MAX_SOURCE_BYTES = 16 * 1024 * 1024;

/** A `processing` claim older than this is treated as abandoned. */
const STALE_CLAIM_MS = 10 * 60 * 1000;

export type ConversionStatus = "processing" | "converted" | "skipped" | "failed";

export interface ConversionRecord {
	sourceId: string;
	sourceFilename: string;
	sourceSize: number | null;
	format: OutputFormat;
	status: ConversionStatus;
	convertedId?: string;
	convertedFilename?: string;
	outputSize?: number;
	encoder?: string;
	reason?: string;
	updatedAt: string;
}

export interface ConvertResult {
	/** `existing` means a finished or in-flight record was found and nothing was done. */
	outcome: "converted" | "skipped" | "failed" | "existing" | "unsupported";
	record?: ConversionRecord;
}

export function conversionKey(sourceId: string, format: OutputFormat): string {
	return `${sourceId}:${format}`;
}

export function isConvertible(mimeType: string): boolean {
	return SOURCE_MIME_TYPES.includes(mimeType.toLowerCase());
}

export function convertedFilename(filename: string, format: OutputFormat): string {
	const base = filename.split("/").pop() ?? filename;
	const dot = base.lastIndexOf(".");
	const stem = dot > 0 ? base.slice(0, dot) : base;
	return `${stem || "image"}.${format}`;
}

export function conversions(ctx: Pick<PluginContext, "storage">): StorageCollection<ConversionRecord> {
	return ctx.storage.conversions as StorageCollection<ConversionRecord>;
}

function now(): string {
	return new Date().toISOString();
}

/**
 * Claim the conversion slot for a source/format pair. Returns false when the
 * pair is already converted, skipped, or being processed by another request.
 * Failed and stale claims are retaken.
 */
async function claim(
	store: StorageCollection<ConversionRecord>,
	key: string,
	record: ConversionRecord,
): Promise<boolean> {
	const current = await store.getVersioned(key);
	if (!current) {
		return (await store.compareAndSet(key, null, record)).applied;
	}
	const { status, updatedAt } = current.value;
	const stale =
		status === "processing" && Date.now() - Date.parse(updatedAt) > STALE_CLAIM_MS;
	if (status !== "failed" && !stale) return false;
	return (await store.compareAndSet(key, current.revision, record)).applied;
}

/**
 * Convert one media item to the configured format and store the result as a
 * new media item. The original is never modified.
 */
export async function convertMedia(
	ctx: PluginContext,
	media: PluginMediaItem,
	settings: Pick<ConvertSettings, "format" | "quality" | "skipIfLarger">,
	getEncoder: () => Promise<Encoder>,
): Promise<ConvertResult> {
	if (!isConvertible(media.mimeType)) return { outcome: "unsupported" };

	const { format } = settings;
	const store = conversions(ctx);
	const key = conversionKey(media.id, format);
	const base: ConversionRecord = {
		sourceId: media.id,
		sourceFilename: media.filename,
		sourceSize: media.size,
		format,
		status: "processing",
		updatedAt: now(),
	};

	if (!(await claim(store, key, base))) {
		return { outcome: "existing", record: (await store.get(key)) ?? undefined };
	}

	const finish = async (patch: Partial<ConversionRecord>): Promise<ConversionRecord> => {
		const record = { ...base, ...patch, updatedAt: now() };
		await store.put(key, record);
		return record;
	};

	try {
		if (media.size != null && media.size > MAX_SOURCE_BYTES) {
			const record = await finish({ status: "skipped", reason: "too-large" });
			return { outcome: "skipped", record };
		}

		const media_ = ctx.media;
		if (!media_?.readBytes || !media_.upload) {
			throw new Error("Missing media:bytes:read or media:write capability");
		}

		const source = await media_.readBytes(media.id, { maxBytes: MAX_SOURCE_BYTES });
		const encoder = await getEncoder();
		const output = await encoder.encode({
			bytes: source.bytes,
			format,
			quality: settings.quality,
		});

		if (settings.skipIfLarger && output.byteLength >= source.bytes.byteLength) {
			const record = await finish({
				status: "skipped",
				reason: "larger",
				outputSize: output.byteLength,
				encoder: encoder.name,
			});
			return { outcome: "skipped", record };
		}

		const filename = convertedFilename(media.filename, format);
		const uploaded = await media_.upload(
			filename,
			FORMAT_MIME[format],
			output.buffer.slice(output.byteOffset, output.byteOffset + output.byteLength) as ArrayBuffer,
		);

		await copyMetadata(ctx, media, uploaded.mediaId);

		const record = await finish({
			status: "converted",
			convertedId: uploaded.mediaId,
			convertedFilename: filename,
			outputSize: output.byteLength,
			encoder: encoder.name,
		});
		ctx.log.info("Converted image", {
			source: media.id,
			converted: uploaded.mediaId,
			format,
			from: source.bytes.byteLength,
			to: output.byteLength,
		});
		return { outcome: "converted", record };
	} catch (error) {
		const reason = error instanceof Error ? error.message : String(error);
		ctx.log.warn("Image conversion failed", { source: media.id, format, reason });
		const record = await finish({ status: "failed", reason: reason.slice(0, 500) });
		return { outcome: "failed", record };
	}
}

/** Carry alt text, caption, and focal point over to the converted copy. */
async function copyMetadata(ctx: PluginContext, media: PluginMediaItem, targetId: string): Promise<void> {
	const update = ctx.media?.updateMetadata;
	if (!update) return;
	const patch: Record<string, string | number> = {};
	if (media.alt) patch.alt = media.alt;
	if (media.caption) patch.caption = media.caption;
	if (media.focalX != null && media.focalY != null) {
		patch.focalX = media.focalX;
		patch.focalY = media.focalY;
	}
	if (Object.keys(patch).length === 0) return;
	try {
		await update.call(ctx.media, targetId, patch);
	} catch (error) {
		ctx.log.warn("Could not copy media metadata", {
			target: targetId,
			reason: error instanceof Error ? error.message : String(error),
		});
	}
}
