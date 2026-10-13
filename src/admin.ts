import type { Block, BlockResponse } from "@emdash-cms/blocks";
import type { PluginContext } from "emdash";

import type { BulkState } from "./bulk.js";
import { cancelBulk, getBulkState, runBulkBatch, startBulk } from "./bulk.js";
import type { ConversionRecord } from "./convert.js";
import { conversions } from "./convert.js";
import type { Encoder } from "./encoder.js";
import type { Messages } from "./i18n.js";
import { getMessages, resolveLocale } from "./i18n.js";
import type { ConvertSettings } from "./settings.js";
import { FORMAT_LABEL, loadSettings, saveSettings } from "./settings.js";

const HISTORY_PAGE_SIZE = 20;

type Interaction =
	| { type: "page_load" }
	| { type: "block_action"; action_id: string; value?: unknown }
	| { type: "form_submit"; action_id: string; values: Record<string, unknown> };

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseInteraction(input: unknown): Interaction | null {
	if (!isRecord(input) || typeof input.type !== "string") return null;
	if (input.type === "page_load") return { type: "page_load" };
	if (typeof input.action_id !== "string") return null;
	if (input.type === "block_action") {
		return { type: "block_action", action_id: input.action_id, value: input.value };
	}
	if (input.type === "form_submit" && isRecord(input.values)) {
		return { type: "form_submit", action_id: input.action_id, values: input.values };
	}
	return null;
}

function formatBytes(bytes: number | null | undefined): string {
	if (bytes == null) return "-";
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function describeRecord(record: ConversionRecord, m: Messages): string {
	if (record.status === "converted" && record.sourceSize && record.outputSize) {
		const saved = Math.round((1 - record.outputSize / record.sourceSize) * 100);
		return `${formatBytes(record.sourceSize)} → ${formatBytes(record.outputSize)} (-${saved}%)`;
	}
	if (record.reason === "larger") return m.reasonLarger;
	if (record.reason === "too-large") return m.reasonTooLarge;
	return record.reason ?? "";
}

async function countByStatus(ctx: PluginContext, format: ConvertSettings["format"]) {
	const store = conversions(ctx);
	const [converted, skipped, failed] = await Promise.all([
		store.count({ format, status: "converted" }),
		store.count({ format, status: "skipped" }),
		store.count({ format, status: "failed" }),
	]);
	return { converted, skipped, failed };
}

function settingsBlocks(settings: ConvertSettings, m: Messages): Block[] {
	return [
		{ type: "header", text: m.settingsHeader },
		{
			type: "form",
			block_id: "settings",
			fields: [
				{
					type: "radio",
					action_id: "format",
					label: m.formatLabel,
					options: [
						{ value: "webp", label: m.formatWebp },
						{ value: "avif", label: m.formatAvif },
					],
					initial_value: settings.format,
				},
				{
					type: "toggle",
					action_id: "autoConvert",
					label: m.autoConvertLabel,
					description: m.autoConvertDescription,
					initial_value: settings.autoConvert,
				},
				{
					type: "number_input",
					action_id: "quality",
					label: m.qualityLabel,
					min: 1,
					max: 100,
					initial_value: settings.quality,
				},
			],
			submit: { label: m.saveSettings, action_id: "save_settings" },
		},
		{
			type: "context",
			text: m.settingsNote,
		},
	];
}

function bulkBlocks(state: BulkState | null, settings: ConvertSettings, m: Messages): Block[] {
	const blocks: Block[] = [{ type: "header", text: m.bulkHeader }];
	const running = state?.status === "running";

	if (state && state.status !== "idle") {
		const format = FORMAT_LABEL[state.format];
		blocks.push({
			type: "banner",
			variant: state.status === "cancelled" ? "alert" : "default",
			title: m.bulkBannerTitle(format, m.bulkStatus[state.status]),
			description: m.bulkBannerCounts(state),
		});
	}

	if (running) {
		blocks.push(
			{
				type: "context",
				text: m.bulkCronHint,
			},
			{
				type: "actions",
				elements: [
					{ type: "button", action_id: "bulk_run", label: m.bulkRunNext, style: "primary" },
					{ type: "button", action_id: "refresh", label: m.bulkRefresh },
					{
						type: "button",
						action_id: "bulk_cancel",
						label: m.bulkStop,
						style: "danger",
						confirm: {
							title: m.bulkStopConfirmTitle,
							text: m.bulkStopConfirmText,
							confirm: m.bulkStopConfirmOk,
							deny: m.bulkStopConfirmDeny,
							style: "danger",
						},
					},
				],
			},
		);
	} else {
		blocks.push(
			{
				type: "section",
				text: m.bulkIntro(FORMAT_LABEL[settings.format]),
			},
			{
				type: "actions",
				elements: [
					{
						type: "button",
						action_id: "bulk_start",
						label: m.bulkStart(FORMAT_LABEL[settings.format]),
						style: "primary",
						confirm: {
							title: m.bulkStartConfirmTitle,
							text: m.bulkStartConfirmText(settings.batchSize),
							confirm: m.bulkStartConfirmOk,
							deny: m.cancel,
						},
					},
				],
			},
		);
	}
	return blocks;
}

async function historyBlocks(
	ctx: PluginContext,
	m: Messages,
	cursor?: string,
): Promise<Block[]> {
	const page = await conversions(ctx).query({
		orderBy: { updatedAt: "desc" },
		limit: HISTORY_PAGE_SIZE,
		cursor,
	});
	return [
		{ type: "header", text: m.historyHeader },
		{
			type: "table",
			page_action_id: "history_page",
			...(page.hasMore && page.cursor ? { next_cursor: page.cursor } : {}),
			empty_text: m.historyEmpty,
			columns: [
				{ key: "source", label: m.colSource },
				{ key: "converted", label: m.colConverted },
				{ key: "status", label: m.colStatus, format: "badge" },
				{ key: "detail", label: m.colDetail },
				{ key: "updatedAt", label: m.colDate, format: "relative_time" },
			],
			rows: page.items.map(({ data }) => ({
				source: data.sourceFilename,
				converted: data.convertedFilename ?? `(${FORMAT_LABEL[data.format]})`,
				status: m.status[data.status],
				detail: describeRecord(data, m),
				updatedAt: data.updatedAt,
			})),
		},
	];
}

async function renderPage(
	ctx: PluginContext,
	m: Messages,
	historyCursor?: string,
): Promise<BlockResponse> {
	const settings = await loadSettings(ctx);
	const [state, counts, history] = await Promise.all([
		getBulkState(ctx),
		countByStatus(ctx, settings.format),
		historyBlocks(ctx, m, historyCursor),
	]);
	return {
		blocks: [
			{ type: "header", text: m.title },
			{
				type: "stats",
				items: [
					{ label: m.statFormat, value: FORMAT_LABEL[settings.format] },
					{ label: m.statAutoConvert, value: settings.autoConvert ? m.on : m.off },
					{ label: m.statConverted(FORMAT_LABEL[settings.format]), value: counts.converted },
					{ label: m.statSkippedFailed, value: `${counts.skipped} / ${counts.failed}` },
				],
			},
			{ type: "divider" },
			...bulkBlocks(state, settings, m),
			{ type: "divider" },
			...settingsBlocks(settings, m),
			{
				type: "actions",
				elements: [
					{ type: "link", label: m.advancedSettings, target: { kind: "plugin-settings" } },
				],
			},
			{ type: "divider" },
			...history,
		],
	};
}

export async function handleAdmin(
	ctx: PluginContext & { input: unknown; request?: Request; ui?: { locale?: string } },
	getEncoder: (settings: ConvertSettings) => () => Promise<Encoder>,
): Promise<BlockResponse> {
	const interaction = parseInteraction(ctx.input);
	if (!interaction) return { blocks: [] };
	const m = getMessages(resolveLocale(ctx));

	if (interaction.type === "page_load") return renderPage(ctx, m);

	if (interaction.type === "form_submit") {
		if (interaction.action_id !== "save_settings") return renderPage(ctx, m);
		const { format, autoConvert, quality } = interaction.values;
		await saveSettings(ctx, { format, autoConvert, quality });
		return {
			...(await renderPage(ctx, m)),
			toast: { message: m.toastSettingsSaved, type: "success" },
		};
	}

	switch (interaction.action_id) {
		case "bulk_start": {
			const settings = await loadSettings(ctx);
			await startBulk(ctx, settings.format);
			const batch = await runBulkBatch(ctx, settings, getEncoder(settings));
			return {
				...(await renderPage(ctx, m)),
				toast: {
					message:
						batch.state?.status === "done" ? m.toastBulkDone : m.toastBulkStarted,
					type: "success",
				},
			};
		}
		case "bulk_run": {
			const settings = await loadSettings(ctx);
			const batch = await runBulkBatch(ctx, settings, getEncoder(settings));
			const message = batch.busy
				? m.toastBusy
				: batch.state?.status === "done"
					? m.toastBulkDone
					: m.toastBatchProcessed;
			return {
				...(await renderPage(ctx, m)),
				toast: { message, type: batch.busy ? "info" : "success" },
			};
		}
		case "bulk_cancel":
			await cancelBulk(ctx);
			return {
				...(await renderPage(ctx, m)),
				toast: { message: m.toastBulkStopped, type: "info" },
			};
		case "history_page":
			return renderPage(ctx, m, typeof interaction.value === "string" ? interaction.value : undefined);
		default:
			return renderPage(ctx, m);
	}
}
