import { beforeEach, describe, expect, it } from "vitest";

import { conversionKey, convertMedia, convertedFilename } from "../src/convert.js";
import type { Encoder } from "../src/encoder.js";
import { resetEncoderCache, resolveEncoder } from "../src/encoder.js";
import { DEFAULT_SETTINGS } from "../src/settings.js";
import { createTestContext, formatOf, makeJpeg, makePng } from "./helpers.js";

const sharpEncoder = () => resolveEncoder("sharp", "IMAGES");

describe("convertedFilename", () => {
	it("swaps the extension", () => {
		expect(convertedFilename("photo.JPG", "webp")).toBe("photo.webp");
		expect(convertedFilename("a.b.png", "avif")).toBe("a.b.avif");
		expect(convertedFilename("noext", "webp")).toBe("noext.webp");
		expect(convertedFilename(".hidden", "webp")).toBe(".hidden.webp");
	});
});

describe("encoder resolution", () => {
	beforeEach(() => resetEncoderCache());

	it("falls back to sharp when no Cloudflare binding is available", async () => {
		const encoder = await resolveEncoder("auto", "IMAGES");
		expect(encoder.name).toBe("sharp");
	});

	it("reports a clear error when the Cloudflare encoder is forced outside Workers", async () => {
		await expect(resolveEncoder("cloudflare", "IMAGES")).rejects.toThrow(/Cloudflare/);
	});
});

describe("convertMedia", () => {
	it.each(["webp", "avif"] as const)("converts JPEG to %s as a new media item", async (format) => {
		const t = createTestContext();
		const jpeg = await makeJpeg();
		const source = t.addMedia("photo.jpg", "image/jpeg", jpeg, {
			alt: "A photo",
			caption: "Caption",
			focalX: 0.3,
			focalY: 0.6,
		});

		const result = await convertMedia(
			t.ctx,
			source,
			{ ...DEFAULT_SETTINGS, format },
			sharpEncoder,
		);

		expect(result.outcome).toBe("converted");
		expect(t.uploads).toHaveLength(1);
		const upload = t.uploads[0]!;
		expect(upload.filename).toBe(`photo.${format}`);
		expect(upload.mimeType).toBe(`image/${format}`);
		expect(await formatOf(upload.bytes)).toBe(format === "avif" ? "heif" : "webp");
		expect(upload.bytes.byteLength).toBeLessThan(jpeg.byteLength);

		// Original is untouched.
		expect(t.media.get(source.id)!.bytes).toBe(jpeg);
		expect(t.media.size).toBe(2);

		expect(t.metadataUpdates).toEqual([
			{ id: upload.id, patch: { alt: "A photo", caption: "Caption", focalX: 0.3, focalY: 0.6 } },
		]);
		expect(t.conversions.get(conversionKey(source.id, format))).toMatchObject({
			status: "converted",
			convertedId: upload.id,
			encoder: "sharp",
		});
	});

	it("converts PNG with transparency", async () => {
		const t = createTestContext();
		const source = t.addMedia("logo.png", "image/png", await makePng());
		const result = await convertMedia(t.ctx, source, { ...DEFAULT_SETTINGS, skipIfLarger: false }, sharpEncoder);
		expect(result.outcome).toBe("converted");
		const meta = await (await import("sharp")).default(t.uploads[0]!.bytes).metadata();
		expect(meta.hasAlpha).toBe(true);
	});

	it("is idempotent per source and format", async () => {
		const t = createTestContext();
		const source = t.addMedia("photo.jpg", "image/jpeg", await makeJpeg());
		await convertMedia(t.ctx, source, DEFAULT_SETTINGS, sharpEncoder);
		const again = await convertMedia(t.ctx, source, DEFAULT_SETTINGS, sharpEncoder);
		expect(again.outcome).toBe("existing");
		expect(t.uploads).toHaveLength(1);

		// A different format is a separate conversion.
		const avif = await convertMedia(t.ctx, source, { ...DEFAULT_SETTINGS, format: "avif" }, sharpEncoder);
		expect(avif.outcome).toBe("converted");
		expect(t.uploads).toHaveLength(2);
	});

	it("ignores formats it does not convert", async () => {
		const t = createTestContext();
		const gif = t.addMedia("anim.gif", "image/gif", new Uint8Array([1, 2, 3]));
		const webp = t.addMedia("x.webp", "image/webp", new Uint8Array([1, 2, 3]));
		expect((await convertMedia(t.ctx, gif, DEFAULT_SETTINGS, sharpEncoder)).outcome).toBe("unsupported");
		expect((await convertMedia(t.ctx, webp, DEFAULT_SETTINGS, sharpEncoder)).outcome).toBe("unsupported");
		expect(t.conversions.data.size).toBe(0);
	});

	it("skips the upload when the output is not smaller", async () => {
		const t = createTestContext();
		const source = t.addMedia("photo.jpg", "image/jpeg", await makeJpeg());
		const bloated: Encoder = {
			name: "sharp",
			encode: async ({ bytes }) => new Uint8Array(bytes.byteLength + 10),
		};
		const result = await convertMedia(t.ctx, source, DEFAULT_SETTINGS, async () => bloated);
		expect(result.outcome).toBe("skipped");
		expect(result.record?.reason).toBe("larger");
		expect(t.uploads).toHaveLength(0);
	});

	it("records failures and retries them later", async () => {
		const t = createTestContext();
		const source = t.addMedia("broken.jpg", "image/jpeg", new Uint8Array([0xff, 0xd8, 0x00]));
		const failed = await convertMedia(t.ctx, source, DEFAULT_SETTINGS, sharpEncoder);
		expect(failed.outcome).toBe("failed");
		expect(failed.record?.reason).toBeTruthy();

		t.media.get(source.id)!.bytes = await makeJpeg();
		const retried = await convertMedia(t.ctx, source, DEFAULT_SETTINGS, sharpEncoder);
		expect(retried.outcome).toBe("converted");
	});

	it("does not run two conversions of the same item concurrently", async () => {
		const t = createTestContext();
		const source = t.addMedia("photo.jpg", "image/jpeg", await makeJpeg());
		const results = await Promise.all([
			convertMedia(t.ctx, source, DEFAULT_SETTINGS, sharpEncoder),
			convertMedia(t.ctx, source, DEFAULT_SETTINGS, sharpEncoder),
		]);
		expect(results.map((r) => r.outcome).sort()).toEqual(["converted", "existing"]);
		expect(t.uploads).toHaveLength(1);
	});
});
