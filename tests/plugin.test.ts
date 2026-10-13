import { validateBlocks } from "@emdash-cms/blocks";
import { describe, expect, it, vi } from "vitest";

import { handleAdmin, parseInteraction } from "../src/admin.js";
import { BULK_CRON_TASK, getBulkState, runBulkBatch, startBulk } from "../src/bulk.js";
import { resolveEncoder } from "../src/encoder.js";
import { createPlugin, imageOptimizerPlugin } from "../src/index.js";
import { SUPPORTED_LOCALES, getMessages } from "../src/i18n.js";
import { DEFAULT_SETTINGS, loadSettings, saveSettings } from "../src/settings.js";
import { createTestContext, makeJpeg, makePng } from "./helpers.js";

const encoderFor = () => () => resolveEncoder("sharp", "IMAGES");

async function seedLibrary(t: ReturnType<typeof createTestContext>) {
	const jpeg = await makeJpeg(160, 120);
	const png = await makePng();
	t.addMedia("a.jpg", "image/jpeg", jpeg);
	t.addMedia("b.jpg", "image/jpeg", jpeg);
	t.addMedia("c.png", "image/png", png);
	t.addMedia("anim.gif", "image/gif", new Uint8Array([1]));
	t.addMedia("d.jpeg", "image/jpeg", jpeg);
	t.addMedia("already.webp", "image/webp", new Uint8Array([1]));
	t.addMedia("e.png", "image/png", png);
}

describe("settings", () => {
	it("uses defaults and clamps stored values", async () => {
		const t = createTestContext({ settings: { format: "gif", quality: 400, batchSize: "3" } });
		expect(await loadSettings(t.ctx)).toEqual({ ...DEFAULT_SETTINGS, quality: 100, batchSize: 3 });
	});

	it("saves only valid values", async () => {
		const t = createTestContext();
		const saved = await saveSettings(t.ctx, { format: "avif", autoConvert: false, quality: "55" });
		expect(saved).toMatchObject({ format: "avif", autoConvert: false, quality: 55 });
		expect(await saveSettings(t.ctx, { format: "png" })).toMatchObject({ format: "avif" });
	});
});

describe("bulk conversion", () => {
	it("walks the library in batches until done", async () => {
		const t = createTestContext();
		await seedLibrary(t);
		const settings = { ...DEFAULT_SETTINGS, batchSize: 3, skipIfLarger: false };

		await startBulk(t.ctx, "webp");
		expect(t.cronTasks.get(BULK_CRON_TASK)).toBe("* * * * *");

		let batches = 0;
		while ((await getBulkState(t.ctx))?.status === "running") {
			const result = await runBulkBatch(t.ctx, settings, encoderFor());
			expect(result.ran).toBe(true);
			batches++;
			expect(batches).toBeLessThan(10);
		}

		const state = await getBulkState(t.ctx);
		// The converted copies join the library mid-job and are scanned but not reconverted.
		expect(state).toMatchObject({ status: "done", converted: 5, failed: 0 });
		expect(state!.scanned).toBeGreaterThanOrEqual(7);
		expect(t.uploads.map((u) => u.filename).sort()).toEqual([
			"a.webp",
			"b.webp",
			"c.webp",
			"d.webp",
			"e.webp",
		]);
		expect(t.cronTasks.has(BULK_CRON_TASK)).toBe(false);

		// A second run converts nothing new.
		await startBulk(t.ctx, "webp");
		while ((await getBulkState(t.ctx))?.status === "running") {
			await runBulkBatch(t.ctx, settings, encoderFor());
		}
		expect(await getBulkState(t.ctx)).toMatchObject({ converted: 0, existing: 5 });
		expect(t.uploads).toHaveLength(5);
	});

	it("refuses to run a batch while another holds the lease", async () => {
		const t = createTestContext();
		await seedLibrary(t);
		const state = await startBulk(t.ctx, "webp");
		await t.ctx.kv.set("bulk:state", { ...state, leaseUntil: Date.now() + 60_000 });
		const result = await runBulkBatch(t.ctx, DEFAULT_SETTINGS, encoderFor());
		expect(result).toMatchObject({ ran: false, busy: true });
		expect(t.uploads).toHaveLength(0);
	});
});

describe("admin page", () => {
	const admin = (t: ReturnType<typeof createTestContext>, input: unknown, locale = "ja") =>
		handleAdmin(
			Object.assign(Object.create(null), t.ctx, {
				input,
				request: new Request("http://localhost/", { headers: { cookie: `emdash-locale=${locale}` } }),
			}),
			encoderFor,
		);

	it("rejects malformed interactions", () => {
		expect(parseInteraction(null)).toBeNull();
		expect(parseInteraction({ type: "block_action" })).toBeNull();
	});

	it("renders valid Block Kit on page load", async () => {
		const t = createTestContext();
		const response = await admin(t, { type: "page_load", page: "/" });
		const validation = validateBlocks(response.blocks);
		expect(validation).toMatchObject({ valid: true });
		expect(JSON.stringify(response)).toContain("一括変換を開始");
	});

	it.each(SUPPORTED_LOCALES)("renders valid Block Kit in %s", async (locale) => {
		const t = createTestContext();
		await seedLibrary(t);
		await admin(t, { type: "block_action", action_id: "bulk_start" }, locale);
		const response = await admin(t, { type: "page_load", page: "/" }, locale);
		expect(validateBlocks(response.blocks)).toMatchObject({ valid: true });
		expect(response.blocks[0]).toEqual({ type: "header", text: getMessages(locale).title });
	});

	it("saves the chosen format from the form", async () => {
		const t = createTestContext();
		const response = await admin(t, {
			type: "form_submit",
			action_id: "save_settings",
			values: { format: "avif", autoConvert: false, quality: 60 },
		});
		expect(response.toast?.type).toBe("success");
		expect(await loadSettings(t.ctx)).toMatchObject({ format: "avif", autoConvert: false, quality: 60 });
		expect(validateBlocks(response.blocks)).toMatchObject({ valid: true });
	});

	it("starts a bulk job and shows progress", async () => {
		const t = createTestContext({ settings: { batchSize: 2, skipIfLarger: false } });
		await seedLibrary(t);
		const response = await admin(t, { type: "block_action", action_id: "bulk_start" });
		expect(await getBulkState(t.ctx)).toMatchObject({ status: "running", scanned: 2, converted: 2 });
		expect(validateBlocks(response.blocks)).toMatchObject({ valid: true });
		expect(JSON.stringify(response)).toContain("次のバッチを実行");

		const cancelled = await admin(t, { type: "block_action", action_id: "bulk_cancel" });
		expect(await getBulkState(t.ctx)).toMatchObject({ status: "cancelled" });
		expect(validateBlocks(cancelled.blocks)).toMatchObject({ valid: true });
	});
});

describe("plugin definition", () => {
	it("keeps descriptor and runtime in sync", () => {
		const descriptor = imageOptimizerPlugin();
		const plugin = createPlugin();
		expect(plugin.id).toBe(descriptor.id);
		expect(plugin.version).toBe(descriptor.version);
		expect([...plugin.capabilities].sort()).toEqual([...(descriptor.capabilities ?? [])].sort());
		expect(plugin.routes).toHaveProperty("admin");
	});

	it("converts on upload when enabled", async () => {
		const t = createTestContext({ settings: { format: "avif" } });
		const item = t.addMedia("upload.jpg", "image/jpeg", await makeJpeg());
		const hook = createPlugin().hooks["media:afterUpload"]!;
		await hook.handler({ media: item }, t.ctx);
		await vi.waitFor(() => expect(t.uploads).toHaveLength(1), { timeout: 10_000 });
		expect(t.uploads[0]!.filename).toBe("upload.avif");
	});

	it("does nothing on upload when disabled or for unsupported types", async () => {
		const t = createTestContext({ settings: { autoConvert: false } });
		const hook = createPlugin().hooks["media:afterUpload"]!;
		await hook.handler({ media: t.addMedia("a.jpg", "image/jpeg", await makeJpeg()) }, t.ctx);
		const t2 = createTestContext();
		await hook.handler({ media: t2.addMedia("a.gif", "image/gif", new Uint8Array([1])) }, t2.ctx);
		await new Promise((r) => setTimeout(r, 200));
		expect(t.uploads).toHaveLength(0);
		expect(t2.uploads).toHaveLength(0);
	});
});
