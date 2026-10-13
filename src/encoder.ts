import type { EncoderName, OutputFormat } from "./settings.js";
import { FORMAT_MIME } from "./settings.js";

export interface EncodeInput {
	bytes: Uint8Array;
	format: OutputFormat;
	quality: number;
}

export interface Encoder {
	readonly name: "cloudflare" | "sharp";
	encode(input: EncodeInput): Promise<Uint8Array>;
}

export class EncoderUnavailableError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "EncoderUnavailableError";
	}
}

/** AVIF encoding is CPU heavy; this effort keeps sharp fast enough for request-time use. */
const SHARP_AVIF_EFFORT = 4;

async function createCloudflareEncoder(bindingName: string): Promise<Encoder> {
	let env: Record<string, unknown>;
	try {
		// Imported lazily: astro.config.mjs loads this package in Node.js,
		// where `cloudflare:workers` does not resolve.
		env = (await import("cloudflare:workers")).env as unknown as Record<string, unknown>;
	} catch {
		throw new EncoderUnavailableError("Not running on Cloudflare Workers");
	}
	const images = env[bindingName] as ImagesBinding | undefined;
	if (!images || typeof images.input !== "function") {
		throw new EncoderUnavailableError(
			`Cloudflare Images binding "${bindingName}" is not configured in wrangler.jsonc`,
		);
	}
	return {
		name: "cloudflare",
		async encode({ bytes, format, quality }) {
			const stream = new Blob([bytes as Uint8Array<ArrayBuffer>]).stream();
			const result = await images
				.input(stream)
				.output({ format: FORMAT_MIME[format] as ImageOutputOptions["format"], quality });
			return new Uint8Array(await result.response().arrayBuffer());
		},
	};
}

type SharpFactory = (input: Uint8Array) => {
	rotate(): ReturnType<SharpFactory>;
	webp(options: { quality: number }): ReturnType<SharpFactory>;
	avif(options: { quality: number; effort: number }): ReturnType<SharpFactory>;
	toBuffer(): Promise<Uint8Array>;
};

async function createSharpEncoder(): Promise<Encoder> {
	let sharp: SharpFactory;
	try {
		// A non-literal specifier keeps bundlers (e.g. the Cloudflare build) from
		// trying to include sharp's native binaries.
		const specifier = "sharp";
		const mod = (await import(/* @vite-ignore */ specifier)) as { default?: SharpFactory };
		if (typeof mod.default !== "function") throw new Error("unexpected export");
		sharp = mod.default;
	} catch {
		throw new EncoderUnavailableError('sharp is not installed (run "pnpm add sharp")');
	}
	return {
		name: "sharp",
		async encode({ bytes, format, quality }) {
			// rotate() applies EXIF orientation, which is dropped from the output.
			const pipeline = sharp(bytes).rotate();
			const out =
				format === "avif"
					? pipeline.avif({ quality, effort: SHARP_AVIF_EFFORT })
					: pipeline.webp({ quality });
			return new Uint8Array(await out.toBuffer());
		},
	};
}

const cache = new Map<string, Promise<Encoder>>();

/**
 * Resolve the encoder backend. `auto` prefers the Cloudflare Images binding
 * and falls back to sharp. Failures are not cached so a later call can
 * succeed once the site is reconfigured.
 */
export function resolveEncoder(name: EncoderName, bindingName: string): Promise<Encoder> {
	const key = `${name}:${bindingName}`;
	let pending = cache.get(key);
	if (!pending) {
		pending = (async () => {
			if (name === "cloudflare") return createCloudflareEncoder(bindingName);
			if (name === "sharp") return createSharpEncoder();
			const reasons: string[] = [];
			for (const create of [() => createCloudflareEncoder(bindingName), createSharpEncoder]) {
				try {
					return await create();
				} catch (error) {
					reasons.push(error instanceof Error ? error.message : String(error));
				}
			}
			throw new EncoderUnavailableError(`No image encoder available: ${reasons.join("; ")}`);
		})();
		cache.set(key, pending);
		pending.catch(() => cache.delete(key));
	}
	return pending;
}

/** Test hook: forget resolved encoders. */
export function resetEncoderCache(): void {
	cache.clear();
}
