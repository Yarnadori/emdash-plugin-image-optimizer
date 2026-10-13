import type { PluginContext, SettingField } from "emdash";

export type OutputFormat = "webp" | "avif";
export type EncoderName = "auto" | "cloudflare" | "sharp";

export interface ConvertSettings {
	/** Output format for new conversions. */
	format: OutputFormat;
	/** Convert images as soon as they are uploaded. */
	autoConvert: boolean;
	/** Encoder quality, 1-100. */
	quality: number;
	/** Discard the conversion when it is not smaller than the original. */
	skipIfLarger: boolean;
	/** Number of media items scanned per bulk batch. */
	batchSize: number;
	/** Which encoder backend to use. */
	encoder: EncoderName;
}

export const DEFAULT_SETTINGS: ConvertSettings = {
	format: "webp",
	autoConvert: true,
	quality: 80,
	skipIfLarger: true,
	batchSize: 5,
	encoder: "auto",
};

export const FORMAT_MIME: Record<OutputFormat, string> = {
	webp: "image/webp",
	avif: "image/avif",
};

export const FORMAT_LABEL: Record<OutputFormat, string> = {
	webp: "WebP",
	avif: "AVIF",
};

/**
 * Settings form shown from the plugin card in Plugins. EmDash renders these
 * labels as static strings, so they are English; the admin page is translated.
 */
export const SETTINGS_SCHEMA: Record<string, SettingField> = {
	format: {
		type: "select",
		label: "Output format",
		description: "Format for new conversions. Original images are kept.",
		options: [
			{ value: "webp", label: "WebP (best compatibility)" },
			{ value: "avif", label: "AVIF (smallest files)" },
		],
		default: DEFAULT_SETTINGS.format,
	},
	autoConvert: {
		type: "boolean",
		label: "Convert on upload",
		default: DEFAULT_SETTINGS.autoConvert,
	},
	quality: {
		type: "number",
		label: "Quality",
		description: "1–100. Lower values produce smaller files.",
		min: 1,
		max: 100,
		default: DEFAULT_SETTINGS.quality,
	},
	skipIfLarger: {
		type: "boolean",
		label: "Skip conversions larger than the original",
		default: DEFAULT_SETTINGS.skipIfLarger,
	},
	batchSize: {
		type: "number",
		label: "Bulk batch size",
		description: "Media items processed per batch. Lower it if batches time out.",
		min: 1,
		max: 50,
		default: DEFAULT_SETTINGS.batchSize,
	},
	encoder: {
		type: "select",
		label: "Encoder",
		options: [
			{ value: "auto", label: "Auto (Cloudflare Images, then sharp)" },
			{ value: "cloudflare", label: "Cloudflare Images binding" },
			{ value: "sharp", label: "sharp (Node.js)" },
		],
		default: DEFAULT_SETTINGS.encoder,
	},
};

function isFormat(value: unknown): value is OutputFormat {
	return value === "webp" || value === "avif";
}

function isEncoder(value: unknown): value is EncoderName {
	return value === "auto" || value === "cloudflare" || value === "sharp";
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
	const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
	if (!Number.isFinite(n)) return fallback;
	return Math.min(max, Math.max(min, Math.round(n)));
}

export async function loadSettings(ctx: Pick<PluginContext, "settings">): Promise<ConvertSettings> {
	const keys = Object.keys(DEFAULT_SETTINGS) as Array<keyof ConvertSettings>;
	const values = await Promise.all(keys.map((key) => ctx.settings.get<unknown>(key)));
	const all = Object.fromEntries(keys.map((key, i) => [key, values[i]])) as Record<
		keyof ConvertSettings,
		unknown
	>;
	const autoConvert = all.autoConvert;
	const skipIfLarger = all.skipIfLarger;
	return {
		format: isFormat(all.format) ? all.format : DEFAULT_SETTINGS.format,
		autoConvert: typeof autoConvert === "boolean" ? autoConvert : DEFAULT_SETTINGS.autoConvert,
		quality: clampInt(all.quality, 1, 100, DEFAULT_SETTINGS.quality),
		skipIfLarger: typeof skipIfLarger === "boolean" ? skipIfLarger : DEFAULT_SETTINGS.skipIfLarger,
		batchSize: clampInt(all.batchSize, 1, 50, DEFAULT_SETTINGS.batchSize),
		encoder: isEncoder(all.encoder) ? all.encoder : DEFAULT_SETTINGS.encoder,
	};
}

export async function saveSettings(
	ctx: Pick<PluginContext, "settings">,
	patch: Partial<Record<keyof ConvertSettings, unknown>>,
): Promise<ConvertSettings> {
	const current = await loadSettings(ctx);
	const next: ConvertSettings = {
		format: isFormat(patch.format) ? patch.format : current.format,
		autoConvert: typeof patch.autoConvert === "boolean" ? patch.autoConvert : current.autoConvert,
		quality: clampInt(patch.quality, 1, 100, current.quality),
		skipIfLarger:
			typeof patch.skipIfLarger === "boolean" ? patch.skipIfLarger : current.skipIfLarger,
		batchSize: clampInt(patch.batchSize, 1, 50, current.batchSize),
		encoder: isEncoder(patch.encoder) ? patch.encoder : current.encoder,
	};
	for (const [key, value] of Object.entries(next)) {
		await ctx.settings.set(key, value);
	}
	return next;
}
