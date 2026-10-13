/**
 * EmDash Image Optimizer
 *
 * Converts uploaded JPEG / PNG images to WebP or AVIF and stores the result
 * as a new media item, leaving the original untouched. Conversion runs on
 * upload and as a resumable bulk job for the existing media library.
 */

import { after, definePlugin } from "emdash";
import type { PluginDescriptor, ResolvedPlugin } from "emdash";

import { handleAdmin } from "./admin.js";
import { BULK_CRON_TASK, runBulkBatch } from "./bulk.js";
import { convertMedia, isConvertible } from "./convert.js";
import { resolveEncoder } from "./encoder.js";
import type { ConvertSettings, OutputFormat } from "./settings.js";
import { SETTINGS_SCHEMA, loadSettings } from "./settings.js";

export const PLUGIN_ID = "image-convert";
export const PLUGIN_VERSION = "0.1.0";
const PACKAGE_NAME = "emdash-plugin-image-optimizer";

export interface ImageOptimizerOptions {
	/** Name of the Cloudflare Images binding in wrangler.jsonc (default: "IMAGES"). */
	imagesBinding?: string;
}

const CAPABILITIES = [
	"media:read",
	"media:bytes:read",
	"media:write",
	"media:metadata:write",
] as const;

const STORAGE = {
	conversions: {
		indexes: ["sourceId", "format", "status", "updatedAt", ["format", "status"]],
	},
};

const ADMIN_PAGES = [{ path: "/", label: "Image Optimizer", icon: "image" }];

/**
 * Descriptor factory for astro.config.mjs:
 *
 * ```js
 * emdash({ plugins: [imageOptimizerPlugin()] })
 * ```
 */
export function imageOptimizerPlugin(
	options: ImageOptimizerOptions = {},
): PluginDescriptor<ImageOptimizerOptions> {
	return {
		id: PLUGIN_ID,
		version: PLUGIN_VERSION,
		format: "native",
		entrypoint: PACKAGE_NAME,
		options,
		capabilities: [...CAPABILITIES],
		adminPages: ADMIN_PAGES,
		settingsSchema: SETTINGS_SCHEMA,
		// Descriptors take flat indexes only; the composite index is in definePlugin.
		storage: { conversions: { indexes: ["sourceId", "format", "status", "updatedAt"] } },
	};
}

export function createPlugin(options: ImageOptimizerOptions = {}): ResolvedPlugin {
	const bindingName = options.imagesBinding ?? "IMAGES";
	const encoderFor = (settings: Pick<ConvertSettings, "encoder">) => () =>
		resolveEncoder(settings.encoder, bindingName);

	return definePlugin({
		id: PLUGIN_ID,
		version: PLUGIN_VERSION,
		capabilities: [...CAPABILITIES],
		storage: STORAGE,

		admin: {
			settingsSchema: SETTINGS_SCHEMA,
			pages: ADMIN_PAGES,
		},

		hooks: {
			"media:afterUpload": {
				errorPolicy: "continue",
				handler: async (event, ctx) => {
					if (!isConvertible(event.media.mimeType)) return;
					const settings = await loadSettings(ctx);
					if (!settings.autoConvert) return;
					// Encoding can take seconds (especially AVIF); keep it off the
					// upload response.
					after(async () => {
						const media = await ctx.media?.get(event.media.id);
						if (!media) return;
						await convertMedia(ctx, media, settings, encoderFor(settings));
					});
				},
			},

			cron: {
				handler: async (event, ctx) => {
					if (event.name !== BULK_CRON_TASK) return;
					const settings = await loadSettings(ctx);
					await runBulkBatch(ctx, settings, encoderFor(settings));
				},
			},
		},

		routes: {
			admin: {
				handler: async (ctx) => handleAdmin(ctx, encoderFor),
			},

			/** Convert a single media item: POST { mediaId, format? } */
			convert: {
				handler: async (ctx) => {
					const input = (ctx.input ?? {}) as { mediaId?: unknown; format?: unknown };
					if (typeof input.mediaId !== "string" || !input.mediaId) {
						return { error: "mediaId is required" };
					}
					const settings = await loadSettings(ctx);
					const format: OutputFormat =
						input.format === "webp" || input.format === "avif" ? input.format : settings.format;
					const media = await ctx.media?.get(input.mediaId);
					if (!media) return { error: "Media not found" };
					return convertMedia(ctx, media, { ...settings, format }, encoderFor(settings));
				},
			},
		},
	});
}

export default createPlugin;

export type { ConvertSettings, EncoderName, OutputFormat } from "./settings.js";
export type { ConversionRecord, ConversionStatus } from "./convert.js";
export type { BulkState } from "./bulk.js";
