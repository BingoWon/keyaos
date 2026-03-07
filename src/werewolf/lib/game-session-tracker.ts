/**
 * 游戏会话追踪器 - 前端直接调用 Supabase
 *
 * 在关键游戏阶段（天黑/天亮/发言）记录和更新游戏数据
 * 每局游戏一条记录，根据游戏进程不断更新
 */

import { supabase } from "@wolf/lib/supabase";
import type { Database } from "@wolf/types/database";

type GameSessionInsert =
	Database["public"]["Tables"]["game_sessions"]["Insert"];
type GameSessionUpdate =
	Database["public"]["Tables"]["game_sessions"]["Update"];

export interface GameSessionConfig {
	playerCount: number;
	difficulty?: string;
	usedCustomKey: boolean;
	modelUsed?: string;
}

interface SessionState {
	sessionId: string | null;
	userId: string | null;
	startTime: number;
	config: GameSessionConfig | null;
	roundsPlayed: number;
	aiCallsCount: number;
	aiInputChars: number;
	aiOutputChars: number;
	aiPromptTokens: number;
	aiCompletionTokens: number;
	lastSyncTime: number;
}

const createInitialState = (): SessionState => ({
	sessionId: null,
	userId: null,
	startTime: 0,
	config: null,
	roundsPlayed: 0,
	aiCallsCount: 0,
	aiInputChars: 0,
	aiOutputChars: 0,
	aiPromptTokens: 0,
	aiCompletionTokens: 0,
	lastSyncTime: 0,
});

let state: SessionState = createInitialState();

// 防抖：避免短时间内重复同步
const SYNC_DEBOUNCE_MS = 5000;

function toErrorDebugObject(error: unknown): Record<string, unknown> {
	if (error == null) return { error: null };
	if (typeof error !== "object") return { error };
	const obj = error as Record<string, unknown>;
	const ownProps = Object.getOwnPropertyNames(error).reduce<
		Record<string, unknown>
	>((acc, k) => {
		acc[k] = (error as any)[k];
		return acc;
	}, {});
	return {
		...ownProps,
		message:
			typeof (obj as any).message === "string"
				? (obj as any).message
				: undefined,
		code: (obj as any).code,
		details: (obj as any).details,
		hint: (obj as any).hint,
		name: (obj as any).name,
	};
}

async function getAccessToken(): Promise<string | null> {
	const { data, error } = await supabase.auth.getSession();
	if (error) return null;
	return data.session?.access_token ?? null;
}

async function createSessionViaApi(payload: {
	playerCount: number;
	difficulty?: string;
	usedCustomKey: boolean;
	modelUsed?: string;
}): Promise<
	| { ok: true; sessionId: string }
	| { ok: false; error: unknown; status?: number }
> {
	const token = await getAccessToken();
	if (!token) return { ok: false, error: new Error("Missing access token") };
	try {
		const res = await fetch("/api/game-sessions", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({ action: "create", ...payload }),
		});
		const json = (await res.json().catch(() => ({}))) as any;
		if (!res.ok || !json?.sessionId) {
			return { ok: false, status: res.status, error: json };
		}
		return { ok: true, sessionId: String(json.sessionId) };
	} catch (error) {
		return { ok: false, error };
	}
}

async function updateSessionViaApi(payload: {
	sessionId: string;
	winner?: "wolf" | "villager" | null;
	completed: boolean;
	roundsPlayed: number;
	durationSeconds: number;
	aiCallsCount: number;
	aiInputChars: number;
	aiOutputChars: number;
	aiPromptTokens: number;
	aiCompletionTokens: number;
}): Promise<{ ok: true } | { ok: false; error: unknown; status?: number }> {
	const token = await getAccessToken();
	if (!token) return { ok: false, error: new Error("Missing access token") };
	try {
		const res = await fetch("/api/game-sessions", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({ action: "update", ...payload }),
		});
		const json = (await res.json().catch(() => ({}))) as any;
		if (!res.ok || json?.success !== true) {
			return { ok: false, status: res.status, error: json };
		}
		return { ok: true };
	} catch (error) {
		return { ok: false, error };
	}
}

/**
 * 游戏会话追踪器
 * 直接通过 Supabase 客户端操作数据库
 */
export const gameSessionTracker = {
	/**
	 * 开始新的游戏会话
	 * 在游戏开始时调用，创建数据库记录
	 */
	async start(config: GameSessionConfig): Promise<string | null> {
		// 获取当前用户
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) {
			console.log(
				"[game-session] No authenticated user, skipping session tracking",
			);
			return null;
		}

		state = {
			...createInitialState(),
			startTime: Date.now(),
			config,
			userId: user.id,
		};

		// 获取用户地区信息（基于浏览器语言和时区）
		const region =
			typeof navigator !== "undefined"
				? `${navigator.language || "unknown"}|${Intl.DateTimeFormat().resolvedOptions().timeZone || "unknown"}`
				: null;

		const insertData: GameSessionInsert = {
			user_id: user.id,
			player_count: config.playerCount,
			difficulty: config.difficulty || null,
			completed: false,
			used_custom_key: config.usedCustomKey,
			model_used: config.modelUsed || null,
			user_email: user.email || null,
			region,
			rounds_played: 0,
			ai_calls_count: 0,
			ai_input_chars: 0,
			ai_output_chars: 0,
			ai_prompt_tokens: 0,
			ai_completion_tokens: 0,
		};

		const apiCreate = await createSessionViaApi({
			playerCount: config.playerCount,
			difficulty: config.difficulty,
			usedCustomKey: config.usedCustomKey,
			modelUsed: config.modelUsed,
		});

		if (apiCreate.ok) {
			const sessionId = apiCreate.sessionId;
			state.sessionId = sessionId;
			state.lastSyncTime = Date.now();
			console.log("[game-session] Session created:", sessionId);
			return sessionId;
		}

		const { data, error } = await supabase
			.from("game_sessions")
			.insert(insertData as never)
			.select("id")
			.single();

		if (error || !data) {
			console.error("[game-session] Failed to create session:", {
				apiError: toErrorDebugObject(apiCreate.error),
				apiStatus: apiCreate.status,
				supabaseError: toErrorDebugObject(error),
			});
			return null;
		}

		const sessionId = (data as { id: string }).id;
		state.sessionId = sessionId;
		state.lastSyncTime = Date.now();
		console.log("[game-session] Session created:", sessionId);
		return sessionId;
	},

	/**
	 * 获取当前会话 ID
	 */
	getSessionId(): string | null {
		return state.sessionId;
	},

	/**
	 * 记录 AI 调用统计
	 */
	addAiCall(stats: {
		inputChars: number;
		outputChars: number;
		promptTokens?: number;
		completionTokens?: number;
	}) {
		state.aiCallsCount += 1;
		state.aiInputChars += stats.inputChars;
		state.aiOutputChars += stats.outputChars;
		if (stats.promptTokens) state.aiPromptTokens += stats.promptTokens;
		if (stats.completionTokens)
			state.aiCompletionTokens += stats.completionTokens;
	},

	/**
	 * 增加回合数并立即同步到数据库
	 */
	async incrementRound(): Promise<void> {
		state.roundsPlayed += 1;
		// 回合数变化时立即同步（绕过防抖）
		await this.syncProgressImmediate();
	},

	/**
	 * 在关键阶段同步数据到数据库（带防抖）
	 * 调用时机：天亮、发言开始等
	 */
	async syncProgress(): Promise<void> {
		if (!state.sessionId || !state.userId) return;

		// 防抖检查
		const now = Date.now();
		if (now - state.lastSyncTime < SYNC_DEBOUNCE_MS) {
			return;
		}

		await this.syncProgressImmediate();
	},

	/**
	 * 立即同步数据到数据库（无防抖）
	 */
	async syncProgressImmediate(): Promise<void> {
		if (!state.sessionId || !state.userId) return;

		const updateData: GameSessionUpdate = {
			rounds_played: state.roundsPlayed,
			ai_calls_count: state.aiCallsCount,
			ai_input_chars: state.aiInputChars,
			ai_output_chars: state.aiOutputChars,
			ai_prompt_tokens: state.aiPromptTokens,
			ai_completion_tokens: state.aiCompletionTokens,
		};

		const durationSeconds = Math.round((Date.now() - state.startTime) / 1000);
		const apiUpdate = await updateSessionViaApi({
			sessionId: state.sessionId,
			completed: false,
			roundsPlayed: updateData.rounds_played ?? 0,
			durationSeconds,
			aiCallsCount: updateData.ai_calls_count ?? 0,
			aiInputChars: updateData.ai_input_chars ?? 0,
			aiOutputChars: updateData.ai_output_chars ?? 0,
			aiPromptTokens: updateData.ai_prompt_tokens ?? 0,
			aiCompletionTokens: updateData.ai_completion_tokens ?? 0,
		});

		if (!apiUpdate.ok) {
			const { error } = await supabase
				.from("game_sessions")
				.update(updateData as never)
				.eq("id", state.sessionId)
				.eq("user_id", state.userId);

			if (error) {
				console.error("[game-session] Failed to sync progress:", {
					apiError: toErrorDebugObject(apiUpdate.error),
					apiStatus: apiUpdate.status,
					supabaseError: toErrorDebugObject(error),
				});
				return;
			}
		}

		state.lastSyncTime = Date.now();
		console.log("[game-session] Progress synced, round:", state.roundsPlayed);
	},

	/**
	 * 结束游戏会话
	 * 在游戏结束时调用，更新最终数据
	 */
	async end(
		winner: "wolf" | "villager" | null,
		completed: boolean,
	): Promise<void> {
		if (!state.sessionId || !state.userId) return;

		const durationSeconds = Math.round((Date.now() - state.startTime) / 1000);

		const updateData: GameSessionUpdate = {
			winner,
			completed,
			rounds_played: state.roundsPlayed,
			duration_seconds: durationSeconds,
			ai_calls_count: state.aiCallsCount,
			ai_input_chars: state.aiInputChars,
			ai_output_chars: state.aiOutputChars,
			ai_prompt_tokens: state.aiPromptTokens,
			ai_completion_tokens: state.aiCompletionTokens,
			ended_at: new Date().toISOString(),
		};

		const apiUpdate = await updateSessionViaApi({
			sessionId: state.sessionId,
			winner,
			completed,
			roundsPlayed: updateData.rounds_played ?? 0,
			durationSeconds: updateData.duration_seconds ?? durationSeconds,
			aiCallsCount: updateData.ai_calls_count ?? 0,
			aiInputChars: updateData.ai_input_chars ?? 0,
			aiOutputChars: updateData.ai_output_chars ?? 0,
			aiPromptTokens: updateData.ai_prompt_tokens ?? 0,
			aiCompletionTokens: updateData.ai_completion_tokens ?? 0,
		});

		if (!apiUpdate.ok) {
			const { error } = await supabase
				.from("game_sessions")
				.update(updateData as never)
				.eq("id", state.sessionId)
				.eq("user_id", state.userId);

			if (error) {
				console.error("[game-session] Failed to end session:", {
					apiError: toErrorDebugObject(apiUpdate.error),
					apiStatus: apiUpdate.status,
					supabaseError: toErrorDebugObject(error),
				});
				return;
			}
		}

		console.log("[game-session] Session ended:", state.sessionId, {
			winner,
			completed,
			durationSeconds,
		});
	},

	/**
	 * 重置追踪器状态
	 */
	reset() {
		state = createInitialState();
	},

	/**
	 * 获取当前统计摘要（用于 sendBeacon 等场景）
	 */
	getSummary(): {
		sessionId: string;
		roundsPlayed: number;
		durationSeconds: number;
		aiCallsCount: number;
		aiInputChars: number;
		aiOutputChars: number;
		aiPromptTokens: number;
		aiCompletionTokens: number;
	} | null {
		if (!state.sessionId) return null;
		return {
			sessionId: state.sessionId,
			roundsPlayed: state.roundsPlayed,
			durationSeconds: Math.round((Date.now() - state.startTime) / 1000),
			aiCallsCount: state.aiCallsCount,
			aiInputChars: state.aiInputChars,
			aiOutputChars: state.aiOutputChars,
			aiPromptTokens: state.aiPromptTokens,
			aiCompletionTokens: state.aiCompletionTokens,
		};
	},
};
