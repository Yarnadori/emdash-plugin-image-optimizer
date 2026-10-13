import type { PluginContext } from "emdash";

import type { ConvertResult } from "./convert.js";
import { convertMedia, isConvertible } from "./convert.js";
import type { Encoder } from "./encoder.js";
import type { ConvertSettings, OutputFormat } from "./settings.js";

export const BULK_STATE_KEY = "bulk:state";
export const BULK_CRON_TASK = "bulk-convert";

/** How long one batch may hold the job before another runner can take over. */
const LEASE_MS = 5 * 60 * 1000;

export type BulkStatus = "idle" | "running" | "done" | "cancelled";

export interface BulkState {
	status: BulkStatus;
	format: OutputFormat;
	cursor?: string;
	/** Media items examined, including non-convertible ones. */
	scanned: number;
	converted: number;
	skipped: number;
	failed: number;
	/** Items that already had a conversion in this format. */
	existing: number;
	startedAt: string;
	updatedAt: string;
	finishedAt?: string;
	leaseUntil?: number;
}

export interface BatchResult {
	ran: boolean;
	busy?: boolean;
	state: BulkState | null;
}

export async function getBulkState(ctx: Pick<PluginContext, "kv">): Promise<BulkState | null> {
	return ctx.kv.get<BulkState>(BULK_STATE_KEY);
}

/** Start a new bulk job, or return the running one unchanged. */
export async function startBulk(ctx: PluginContext, format: OutputFormat): Promise<BulkState> {
	const current = await ctx.kv.getVersioned<BulkState>(BULK_STATE_KEY);
	if (current?.value.status === "running") return current.value;

	const timestamp = new Date().toISOString();
	const state: BulkState = {
		status: "running",
		format,
		scanned: 0,
		converted: 0,
		skipped: 0,
		failed: 0,
		existing: 0,
		startedAt: timestamp,
		updatedAt: timestamp,
	};
	const result = await ctx.kv.compareAndSet(BULK_STATE_KEY, current?.revision ?? null, state);
	if (!result.applied) {
		return (await getBulkState(ctx)) ?? state;
	}
	// Background progress where the host runs plugin cron; the admin page can
	// also drive batches manually.
	try {
		await ctx.cron?.schedule(BULK_CRON_TASK, { schedule: "* * * * *" });
	} catch (error) {
		ctx.log.warn("Could not schedule bulk conversion cron", {
			reason: error instanceof Error ? error.message : String(error),
		});
	}
	return state;
}

export async function cancelBulk(ctx: PluginContext): Promise<BulkState | null> {
	const state = await getBulkState(ctx);
	await ctx.cron?.cancel(BULK_CRON_TASK).catch(() => undefined);
	if (!state || state.status !== "running") return state;
	const next: BulkState = {
		...state,
		status: "cancelled",
		leaseUntil: undefined,
		updatedAt: new Date().toISOString(),
	};
	await ctx.kv.set(BULK_STATE_KEY, next);
	return next;
}

function tally(state: BulkState, result: ConvertResult): void {
	switch (result.outcome) {
		case "converted":
			state.converted++;
			break;
		case "skipped":
			state.skipped++;
			break;
		case "failed":
			state.failed++;
			break;
		case "existing":
			state.existing++;
			break;
		case "unsupported":
			break;
	}
}

/**
 * Process one page of the media library. A KV lease keeps the admin button
 * and the cron task from processing the same page concurrently.
 */
export async function runBulkBatch(
	ctx: PluginContext,
	settings: Pick<ConvertSettings, "quality" | "skipIfLarger" | "batchSize">,
	getEncoder: () => Promise<Encoder>,
): Promise<BatchResult> {
	const current = await ctx.kv.getVersioned<BulkState>(BULK_STATE_KEY);
	if (!current || current.value.status !== "running") {
		await ctx.cron?.cancel(BULK_CRON_TASK).catch(() => undefined);
		return { ran: false, state: current?.value ?? null };
	}
	if ((current.value.leaseUntil ?? 0) > Date.now()) {
		return { ran: false, busy: true, state: current.value };
	}

	const leased: BulkState = { ...current.value, leaseUntil: Date.now() + LEASE_MS };
	const claim = await ctx.kv.compareAndSet(BULK_STATE_KEY, current.revision, leased);
	if (!claim.applied) {
		return { ran: false, busy: true, state: await getBulkState(ctx) };
	}

	const state: BulkState = { ...leased };
	let hasMore = true;
	try {
		if (!ctx.media) throw new Error("Missing media:read capability");
		const page = await ctx.media.list({
			limit: settings.batchSize,
			cursor: state.cursor,
			mimeType: "image/",
		});
		for (const item of page.items) {
			state.scanned++;
			if (!isConvertible(item.mimeType)) continue;
			tally(state, await convertMedia(ctx, item, { ...settings, format: state.format }, getEncoder));
		}
		state.cursor = page.cursor;
		hasMore = page.hasMore && !!page.cursor;
	} catch (error) {
		ctx.log.error("Bulk conversion batch failed", {
			reason: error instanceof Error ? error.message : String(error),
		});
	}

	// The job may have been cancelled while this batch ran; keep that status.
	const latest = await getBulkState(ctx);
	const timestamp = new Date().toISOString();
	const next: BulkState = {
		...state,
		leaseUntil: undefined,
		updatedAt: timestamp,
	};
	if (latest && latest.status !== "running") {
		next.status = latest.status;
	} else if (!hasMore) {
		next.status = "done";
		next.finishedAt = timestamp;
	}
	await ctx.kv.set(BULK_STATE_KEY, next);
	if (next.status !== "running") {
		await ctx.cron?.cancel(BULK_CRON_TASK).catch(() => undefined);
	}
	return { ran: true, state: next };
}
