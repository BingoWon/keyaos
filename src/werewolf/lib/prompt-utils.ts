import type { SystemPromptPart } from "@wolf/game/core/types";
import { getI18n } from "@wolf/i18n/translator";
import type {
	DailySummaryVoteData,
	DifficultyLevel,
	GameState,
	Player,
} from "@wolf/types/game";
import { isWolfRole } from "@wolf/types/game";
import { getSystemMessages, getSystemPatterns } from "./game-texts";
import type { LLMMessage } from "./llm";

/**
 * Prompt helper utilities used by Phase prompts.
 */

export const getRoleText = (role: string) => {
	const { t } = getI18n();
	switch (role) {
		case "Werewolf":
			return t("promptUtils.roleText.werewolf");
		case "WhiteWolfKing":
			return t("promptUtils.roleText.whiteWolfKing");
		case "Seer":
			return t("promptUtils.roleText.seer");
		case "Witch":
			return t("promptUtils.roleText.witch");
		case "Hunter":
			return t("promptUtils.roleText.hunter");
		case "Guard":
			return t("promptUtils.roleText.guard");
		case "Idiot":
			return t("promptUtils.roleText.idiot");
		default:
			return t("promptUtils.roleText.villager");
	}
};

export const getWinCondition = (role: string) => {
	const { t } = getI18n();
	switch (role) {
		case "Werewolf":
			return t("promptUtils.winCondition.werewolf");
		case "WhiteWolfKing":
			return t("promptUtils.winCondition.whiteWolfKing");
		case "Seer":
			return t("promptUtils.winCondition.seer");
		case "Witch":
			return t("promptUtils.winCondition.witch");
		case "Hunter":
			return t("promptUtils.winCondition.hunter");
		case "Guard":
			return t("promptUtils.winCondition.guard");
		case "Idiot":
			return t("promptUtils.winCondition.idiot");
		default:
			return t("promptUtils.winCondition.villager");
	}
};

/**
 * Role-specific strategy tips (know-how) to help AI make better decisions
 * These tips are tailored to each role to prevent homogenization
 */
export const getRoleKnowHow = (role: string): string => {
	const { t } = getI18n();
	switch (role) {
		case "Werewolf":
			return t.raw("promptUtils.roleKnowHow.werewolf");
		case "WhiteWolfKing":
			return t.raw("promptUtils.roleKnowHow.whiteWolfKing");
		case "Seer":
			return t.raw("promptUtils.roleKnowHow.seer");
		case "Witch":
			return t.raw("promptUtils.roleKnowHow.witch");
		case "Hunter":
			return t.raw("promptUtils.roleKnowHow.hunter");
		case "Guard":
			return t.raw("promptUtils.roleKnowHow.guard");
		case "Idiot":
			return t.raw("promptUtils.roleKnowHow.idiot");
		default:
			return t.raw("promptUtils.roleKnowHow.villager");
	}
};

/**
 * Build situational strategy based on current game state.
 * Provides context-aware tactical suggestions without being overly restrictive.
 */
export const buildSituationalStrategy = (
	state: GameState,
	player: Player,
): string => {
	const lines: string[] = [];

	if (player.role === "Seer") {
		const checks = state.nightActions.seerHistory || [];
		if (checks.length === 0) {
			return "";
		}

		const hasWolfCheck = checks.some((c) => c.isWolf);
		const hasGoodCheck = checks.some((c) => !c.isWolf);
		const latestCheck = checks[checks.length - 1];
		const _latestTarget = state.players.find(
			(p) => p.seat === latestCheck.targetSeat,
		);

		lines.push("<situational_tips>");
		if (hasWolfCheck && state.day === 1) {
			lines.push("【当前情境】你首验查杀！这是强信息。");
			lines.push("【可选策略】");
			lines.push("- 跳身份带节奏，报出查杀的座位号");
			lines.push("- 给出今日归票建议");
			lines.push("- 准备好应对可能的狼人对跳");
		} else if (hasGoodCheck && !hasWolfCheck) {
			lines.push("【当前情境】你目前只有金水（好人验），信息量有限。");
			lines.push("【可选策略】");
			lines.push("- 潜水观察，等待更多信息后再跳");
			lines.push("- 或跳身份报金水，争取话语权");
			lines.push("- 观察是否有人对跳，判断真假预言家");
		} else if (hasWolfCheck && state.day > 1) {
			lines.push("【当前情境】你有查杀记录。");
			lines.push("【可选策略】");
			lines.push("- 继续推进查杀目标出局");
			lines.push("- 结合新的查验结果分析局势");
		}
		lines.push("</situational_tips>");
	}

	if (isWolfRole(player.role)) {
		const aliveWolves = state.players.filter(
			(p) => isWolfRole(p.role) && p.alive,
		);
		const isLastWolf = aliveWolves.length === 1;

		lines.push("<situational_tips>");
		if (isLastWolf) {
			lines.push("【当前情境】你是最后一只狼！");
			lines.push("【可选策略】");
			lines.push("- 低调发言，避免被集火");
			lines.push("- 引导好人内斗");
			lines.push("- 寻找机会翻盘");
		} else if (state.day === 1) {
			lines.push("【当前情境】首日发言，建立信任很关键。");
			lines.push("【可选策略】");
			lines.push("- 像好人一样分析局势");
			lines.push("- 不要过早站边或暴露狼视角");
			lines.push("- 可以适当质疑可疑发言");
		}
		lines.push("</situational_tips>");
	}

	if (player.role === "Witch") {
		const hasHeal = !state.roleAbilities.witchHealUsed;
		const hasPoison = !state.roleAbilities.witchPoisonUsed;

		if (!hasHeal && !hasPoison) {
			return "";
		}

		lines.push("<situational_tips>");
		lines.push("【当前情境】你是女巫。");
		if (hasHeal && hasPoison) {
			lines.push("- 解药和毒药都还在，谨慎使用");
		} else if (hasHeal) {
			lines.push("- 解药还在，留给关键好人");
		} else if (hasPoison) {
			lines.push("- 毒药还在，留给确认的狼人");
		}
		lines.push("- 你知道谁被刀了，这是重要信息");
		lines.push("</situational_tips>");
	}

	return lines.join("\n");
};

/**
 * Build difficulty hint for speech generation.
 * Now always uses "hard" level strategy for better AI performance.
 * The difficulty parameter is kept for backward compatibility but ignored.
 */
export const buildDifficultySpeechHint = (
	_difficulty?: DifficultyLevel,
): string => {
	const { t } = getI18n();
	// Always use hard difficulty for better strategic depth
	return t("promptUtils.difficultySpeech.hard");
};

/**
 * Build difficulty hint for decision making.
 * Now always uses "hard" level strategy for better AI performance.
 * The difficulty parameter is kept for backward compatibility but ignored.
 */
export const buildDifficultyDecisionHint = (
	_difficulty?: DifficultyLevel,
	role?: string,
): string => {
	const { t } = getI18n();
	const roleNote = isWolfRole(role)
		? t("promptUtils.difficultyDecision.roleNoteWerewolf")
		: t("promptUtils.difficultyDecision.roleNoteGood");

	// Always use hard difficulty for better strategic depth
	return t("promptUtils.difficultyDecision.hard", { roleNote });
};

export const buildPersonaSection = (
	player: Player,
	isGenshinMode: boolean = false,
): string => {
	if (isGenshinMode || !player.agentProfile) return "";
	const { t } = getI18n();
	const { persona } = player.agentProfile;
	const separator = t("promptUtils.gameContext.listSeparator");

	const base = t("promptUtils.persona.section", {
		voiceRules: persona.voiceRules.join(separator),
		riskLabel: t("promptUtils.persona.riskBalanced"),
	});
	const extraInfo = persona.basicInfo?.trim()
		? `\n${t("promptUtils.persona.basicInfo", { basicInfo: persona.basicInfo.trim() })}`
		: "";
	return `${base}${extraInfo}`;
};

export const buildAliveCountsSection = (state: GameState): string => {
	const { t } = getI18n();
	const alive = state.players.filter((p) => p.alive);

	return t("promptUtils.aliveCounts", { count: alive.length });
};

/** Format structured vote_data into readable text for <history>. Seat numbers in vote_data are 0-based. */
function formatVoteDataForHistory(v: DailySummaryVoteData): string {
	const { t } = getI18n();
	const separator = t("promptUtils.gameContext.listSeparator");
	const parts: string[] = [];
	const fmt = (votes: Record<string, number[]>) =>
		Object.entries(votes)
			.map(([target, arr]) => {
				const voters = (arr as number[])
					.map((s) => t("promptUtils.gameContext.seatLabel", { seat: s + 1 }))
					.join(separator);
				const targetNum = Number.parseInt(target, 10);
				return t("promptUtils.gameContext.votersVotedFor", {
					voters,
					target: Number.isFinite(targetNum) ? targetNum + 1 : target,
				});
			})
			.filter(Boolean)
			.join(t("promptUtils.gameContext.semicolon"));
	if (v.sheriff_election) {
		const { winner, votes } = v.sheriff_election;
		const base = t("promptUtils.gameContext.sheriffVote", { seat: winner + 1 });
		const detail = fmt(votes);
		parts.push(
			detail
				? `${base}${t("promptUtils.gameContext.semicolon")}${detail}`
				: base,
		);
	}
	if (v.execution_vote) {
		const { eliminated, votes } = v.execution_vote;
		const base = t("promptUtils.gameContext.executionVote", {
			seat: eliminated + 1,
		});
		const detail = fmt(votes);
		parts.push(
			detail
				? `${base}${t("promptUtils.gameContext.semicolon")}${detail}`
				: base,
		);
	}
	return parts.join(" ");
}

export const buildDailySummariesSection = (state: GameState): string => {
	const { t } = getI18n();
	// Get summaries from dailySummaries (new format: single paragraph text)
	const entries = Object.entries(state.dailySummaries || {})
		.map(([day, bullets]) => ({ day: Number(day), bullets }))
		.filter((x) => Number.isFinite(x.day) && Array.isArray(x.bullets));

	if (entries.length === 0) return "";

	const lines: string[] = [];
	const separator = t("promptUtils.gameContext.semicolon");
	for (const { day, bullets } of entries.sort((a, b) => a.day - b.day)) {
		const summaryTexts = bullets
			.filter((x): x is string => typeof x === "string")
			.map((s) => s.trim())
			.filter(Boolean);

		if (summaryTexts.length === 0) continue;

		const fullSummary = summaryTexts.join(separator);

		// Append structured vote_data so "who voted for whom" is never lost
		const voteData = state.dailySummaryVoteData?.[day];
		const voteText = voteData ? formatVoteDataForHistory(voteData) : "";
		const dayLabel = t("promptUtils.gameContext.dayLabel", { day });
		const line = voteText
			? `${dayLabel}${fullSummary} ${voteText}`
			: `${dayLabel}${fullSummary}`;
		lines.push(line);
	}

	if (lines.length === 0) return "";
	return `<history>\n${lines.join("\n\n")}\n</history>`;
};

export const getDayStartIndex = (state: GameState): number => {
	const systemMessages = getSystemMessages();
	for (let i = state.messages.length - 1; i >= 0; i--) {
		const m = state.messages[i];
		// Match both Chinese and English versions
		if (
			m.isSystem &&
			(m.content === "天亮了" ||
				m.content === "Dawn breaks, please open your eyes" ||
				m.content === systemMessages.dayBreak)
		)
			return i;
	}
	return 0;
};

export const getVoteStartIndex = (state: GameState): number => {
	const systemMessages = getSystemMessages();
	for (let i = state.messages.length - 1; i >= 0; i--) {
		const m = state.messages[i];
		// Match both Chinese and English versions
		if (
			m.isSystem &&
			(m.content === "进入投票环节" ||
				m.content === "发言结束，开始投票。" ||
				m.content === "Discussion ends, voting begins." ||
				m.content === systemMessages.voteStart)
		)
			return i;
	}
	return state.messages.length;
};

/**
 * Check if today's transcript is long enough to warrant a mid-day summary
 * Returns the transcript length and whether summary is needed
 */
export const checkNeedsMidDaySummary = (
	state: GameState,
	threshold: number = 6000,
): {
	transcriptLength: number;
	needsSummary: boolean;
	hasSummary: boolean;
} => {
	const dayStartIndex = getDayStartIndex(state);
	const voteStartIndex = getVoteStartIndex(state);

	const slice = state.messages.slice(
		dayStartIndex,
		voteStartIndex > dayStartIndex ? voteStartIndex : state.messages.length,
	);

	const transcript = slice
		.filter((m) => !m.isSystem)
		.map((m) => m.content)
		.join("\n");

	const hasSummary = !!(
		(state.dailySummaryFacts?.[state.day]?.length ?? 0) > 0 ||
		(state.dailySummaries?.[state.day]?.length ?? 0) > 0
	);

	return {
		transcriptLength: transcript.length,
		needsSummary: transcript.length > threshold && !hasSummary,
		hasSummary,
	};
};

export const buildTodayTranscript = (
	state: GameState,
	maxChars: number,
	options?: { includeDeadSpeech?: boolean },
): string => {
	const { t } = getI18n();
	const dayStartIndex = getDayStartIndex(state);
	const voteStartIndex = getVoteStartIndex(state);

	const slice = state.messages.slice(
		dayStartIndex,
		voteStartIndex > dayStartIndex ? voteStartIndex : state.messages.length,
	);

	// Build a map of playerId -> alive status for quick lookup
	const playerAliveMap = new Map<string, boolean>();
	state.players.forEach((p) => {
		playerAliveMap.set(p.playerId, p.alive);
	});
	const includeDeadSpeech = options?.includeDeadSpeech === true;

	// Separate last words from regular speech for priority handling
	const regularMessages = slice.filter((m) => {
		if (m.isSystem || m.isLastWords) return false;
		const isAlive = playerAliveMap.get(m.playerId) ?? true;
		return includeDeadSpeech || isAlive;
	});
	const lastWordsMessages = slice.filter((m) => {
		if (m.isSystem || !m.isLastWords) return false;
		const isAlive = playerAliveMap.get(m.playerId) ?? true;
		return includeDeadSpeech || isAlive;
	});

	const formatMessage = (m: (typeof slice)[0]) => {
		const player = state.players.find((p) => p.playerId === m.playerId);
		// Only use seat number for prompt, no player name (to anonymize for model)
		const speaker = player
			? t("mentions.seatLabel", { seat: player.seat + 1 })
			: m.playerName;
		const isAlive = playerAliveMap.get(m.playerId) ?? true;
		const statusLabel = isAlive ? "" : t("promptUtils.gameContext.eliminated");
		const lastWordsLabel = m.isLastWords
			? t("promptUtils.gameContext.lastWordsLabel")
			: "";
		return `${lastWordsLabel}${speaker}${statusLabel}: ${m.content}`;
	};

	// Last words are always preserved (they're important)
	const lastWordsText = lastWordsMessages.map(formatMessage).join("\n");
	const regularText = regularMessages.map(formatMessage).join("\n");

	const transcript = [lastWordsText, regularText].filter(Boolean).join("\n");

	if (!transcript) return "";
	if (transcript.length <= maxChars) return transcript;

	const summaryFacts = state.dailySummaryFacts?.[state.day];
	const summaryBullets = state.dailySummaries?.[state.day];
	const summaryItems =
		summaryFacts && summaryFacts.length > 0
			? summaryFacts.map((f) => f.fact).filter(Boolean)
			: summaryBullets || [];

	if (summaryItems.length > 0) {
		const separator = t("promptUtils.gameContext.semicolon");
		const maxSummaryChars = Math.min(
			1200,
			Math.max(300, Math.floor(maxChars * 0.4)),
		);
		let summaryText = "";
		for (const item of summaryItems) {
			const clean = String(item).trim();
			if (!clean) continue;
			const candidate = summaryText
				? `${summaryText}${separator}${clean}`
				: clean;
			if (candidate.length > maxSummaryChars) break;
			summaryText = candidate;
		}
		const header = `<early_summary>${summaryText}</early_summary>\n<recent_speech>\n`;
		const footer = `\n</recent_speech>`;

		// Reserve space for last words (always include)
		const lastWordsReserve = lastWordsText ? lastWordsText.length + 50 : 0;
		const availableForRecent =
			maxChars - header.length - footer.length - lastWordsReserve;

		// Get recent regular messages
		const recentRegular =
			availableForRecent > 0 ? regularText.slice(-availableForRecent) : "";

		// Combine: summary + last words + recent regular
		const lastWordsPart = lastWordsText
			? `<last_words>\n${lastWordsText}\n</last_words>\n`
			: "";
		return `${header}${lastWordsPart}${recentRegular}${footer}`.trim();
	}

	// No summary: prioritize last words, then use sliding window for regular
	if (lastWordsText) {
		const lastWordsPart = `<last_words>\n${lastWordsText}\n</last_words>\n`;
		const availableForRecent = maxChars - lastWordsPart.length;
		const recentRegular =
			availableForRecent > 0 ? regularText.slice(-availableForRecent) : "";
		return `${lastWordsPart}<recent_speech>\n${recentRegular}\n</recent_speech>`.trim();
	}

	// No last words, just sliding window
	return `<today_speech>\n${transcript.slice(-maxChars)}\n</today_speech>`;
};

export const buildPlayerTodaySpeech = (
	state: GameState,
	player: Player,
	maxChars: number,
): string => {
	const dayStartIndex = getDayStartIndex(state);
	const voteStartIndex = getVoteStartIndex(state);

	const slice = state.messages.slice(
		dayStartIndex,
		voteStartIndex > dayStartIndex ? voteStartIndex : state.messages.length,
	);

	const speech = slice
		.filter((m) => !m.isSystem && m.playerId === player.playerId)
		.map((m) => m.content)
		.join("\n");

	if (!speech) return "";
	return speech.slice(0, maxChars);
};

export const buildSystemAnnouncementsSinceDawn = (
	state: GameState,
	maxLines: number,
): string => {
	const dayStartIndex = getDayStartIndex(state);
	const systemMessages = getSystemMessages();
	const systemPatterns = getSystemPatterns();
	const excluded = [
		"天亮了",
		"Dawn breaks, please open your eyes",
		systemMessages.dayBreak,
		"进入投票环节",
		"发言结束，开始投票。",
		"Discussion ends, voting begins.",
		systemMessages.voteStart,
	];

	const slice = state.messages.slice(dayStartIndex);
	const systemLines = slice
		.filter((m) => m.isSystem)
		.map((m) => String(m.content || "").trim())
		.filter((c) => {
			if (!c) return false;
			// 过滤掉带有 0-based 索引的原始 JSON 数据，避免混淆 AI
			if (c.startsWith("[VOTE_RESULT]")) return false;
			// Filter out dawn and vote start messages in both locales
			if (excluded.includes(c)) return false;
			if (
				systemPatterns.playerKilled.test(c) ||
				systemPatterns.playerPoisoned.test(c) ||
				systemPatterns.playerMilkKilled.test(c)
			) {
				return false;
			}
			return true;
		});

	const limit = Math.max(0, maxLines);
	if (limit === 0 || systemLines.length === 0) return "";
	const recentLines =
		systemLines.length > limit ? systemLines.slice(-limit) : systemLines;
	return recentLines.join("\n");
};

/**
 * Build role-specific private information section.
 * This is placed at the TOP of the context to ensure AI sees it first.
 */
const buildRolePrivateInfo = (
	state: GameState,
	player: Player,
): string | null => {
	const { t: _t } = getI18n();

	if (player.role === "Seer") {
		const history = state.nightActions.seerHistory || [];
		if (history.length === 0) return null;

		const checks = history.map((record) => {
			const target = state.players.find((p) => p.seat === record.targetSeat);
			const resultEmoji = record.isWolf ? "🐺 狼人" : "✓ 好人";
			return `  第${record.day}夜 → ${record.targetSeat + 1}号${target?.displayName || ""} = ${resultEmoji}`;
		});

		return `<your_seer_checks>
【你的查验记录】
${checks.join("\n")}
</your_seer_checks>`;
	}

	if (player.role === "Witch") {
		const healStatus = state.roleAbilities.witchHealUsed ? "已用" : "可用";
		const poisonStatus = state.roleAbilities.witchPoisonUsed ? "已用" : "可用";
		const witchActions: string[] = [];
		const wolfTargetInfo: string[] = [];

		if (state.nightHistory) {
			Object.entries(state.nightHistory).forEach(([day, history]) => {
				// 收集狼人刀口信息，只有当解药未使用或已被使用但未救人时才显示刀口
				if (history.wolfTarget !== undefined) {
					const targetPlayer = state.players.find(
						(p) => p.seat === history.wolfTarget,
					);
					if (targetPlayer) {
						// 如果解药未被使用，则显示刀口信息；如果解药被使用并且确实救了人，也显示原本的刀口
						if (!state.roleAbilities.witchHealUsed || history.witchSave) {
							wolfTargetInfo.push(
								`  第${day}夜：狼目标为 ${history.wolfTarget + 1}号${targetPlayer.displayName}`,
							);
						}
					}
				}

				if (history.witchSave && history.wolfTarget !== undefined) {
					const savedPlayer = state.players.find(
						(p) => p.seat === history.wolfTarget,
					);
					if (savedPlayer) {
						witchActions.push(
							`  第${day}夜：救了 ${history.wolfTarget + 1}号${savedPlayer.displayName}`,
						);
					}
				}
				if (history.witchPoison !== undefined) {
					const poisonedPlayer = state.players.find(
						(p) => p.seat === history.witchPoison,
					);
					if (poisonedPlayer) {
						witchActions.push(
							`  第${day}夜：毒了 ${history.witchPoison + 1}号${poisonedPlayer.displayName}`,
						);
					}
				}
			});
		}
		let witchInfo = `<your_potions>
【你的药水状态】解药: ${healStatus} | 毒药: ${poisonStatus}`;
		if (wolfTargetInfo.length > 0) {
			witchInfo += `\n【刀口信息】\n${wolfTargetInfo.join("\n")}`;
		}
		if (witchActions.length > 0) {
			witchInfo += `\n【用药记录】\n${witchActions.join("\n")}`;
		}
		witchInfo += `\n</your_potions>`;
		return witchInfo;
	}

	if (player.role === "Guard") {
		const lastTarget =
			state.nightActions.lastGuardTarget !== undefined
				? state.players.find(
						(p) => p.seat === state.nightActions.lastGuardTarget,
					)
				: null;
		const guardedSeat = state.nightActions.lastGuardTarget;

		if (guardedSeat !== undefined && lastTarget) {
			const wasProtectionEffective = lastTarget.alive;
			const protectionResult = wasProtectionEffective
				? `${guardedSeat + 1}号${lastTarget.displayName} 今天仍然存活`
				: `${guardedSeat + 1}号${lastTarget.displayName} 已出局`;

			return `<your_guard_info>
【昨晚守护】${guardedSeat + 1}号${lastTarget.displayName}
【守护结果】${protectionResult}
【今晚限制】不能连续守护 ${guardedSeat + 1}号
</your_guard_info>`;
		} else {
			return `<your_guard_info>
【首次行动】你之前没有守护过任何人
【今晚限制】无，可以守护任何存活玩家
</your_guard_info>`;
		}
	}

	if (isWolfRole(player.role)) {
		const teammates = state.players.filter(
			(p) => isWolfRole(p.role) && p.alive && p.playerId !== player.playerId,
		);
		const allWolves = state.players.filter((p) => isWolfRole(p.role));
		const aliveWolves = allWolves.filter((p) => p.alive);
		const teammateList =
			teammates.length > 0
				? teammates.map((tm) => `${tm.seat + 1}号${tm.displayName}`).join("、")
				: "无存活队友";

		return `<your_wolf_team>
【狼队友】${teammateList}
【狼人存活】${aliveWolves.length}/${allWolves.length}
</your_wolf_team>`;
	}

	return null;
};

export const buildGameContext = (
	state: GameState,
	player: Player,
	options?: { excludePendingDeaths?: boolean },
): string => {
	const { t } = getI18n();
	const alivePlayers = state.players.filter((p) => p.alive);
	const deadPlayers = state.players.filter((p) => !p.alive);
	const totalSeats = state.players.length;
	const publicGenericDeathCause = t("promptUtils.gameContext.deathCauseDeath");
	const publicExecutionCause = publicGenericDeathCause;

	// === 第一优先级：角色私有信息（放在最前面） ===
	const privateInfo = buildRolePrivateInfo(state, player);
	let context = privateInfo ? `${privateInfo}\n\n` : "";

	// Build YAML-formatted game state
	const aliveSeats = alivePlayers.map((p) => p.seat + 1);
	const deadInfo = deadPlayers.map((p) => {
		// Find death info
		let cause = publicGenericDeathCause;
		let deathDay = 0;
		for (const [day, history] of Object.entries(state.nightHistory || {})) {
			if (history.wolfTarget === p.seat) {
				cause = publicGenericDeathCause;
				deathDay = Number(day);
			}
			if (history.witchPoison === p.seat) {
				cause = publicGenericDeathCause;
				deathDay = Number(day);
			}
			if (Array.isArray(history.deaths)) {
				const match = history.deaths.find((d) => d.seat === p.seat);
				if (match) {
					cause = publicGenericDeathCause;
					deathDay = Number(day);
				}
			}
			if (history.hunterShot?.targetSeat === p.seat) {
				cause = publicGenericDeathCause;
				deathDay = Number(day);
			}
		}
		for (const [day, history] of Object.entries(state.dayHistory || {})) {
			if (history.executed?.seat === p.seat) {
				cause = publicExecutionCause;
				deathDay = Number(day);
			}
			if (history.hunterShot?.targetSeat === p.seat) {
				cause = publicGenericDeathCause;
				deathDay = Number(day);
			}
		}
		return `{seat: ${p.seat + 1}, name: ${p.displayName}, day: ${deathDay}, cause: ${cause}}`;
	});

	const sheriffSeat = state.badge.holderSeat;
	const sheriffInfo =
		sheriffSeat !== null
			? sheriffSeat + 1
			: t("promptUtils.gameContext.noSheriff");

	// 明确的时间和身份提示，放在最前面
	const isNight = state.phase.includes("NIGHT");
	const phaseText = isNight
		? t("promptUtils.gameContext.night")
		: t("promptUtils.gameContext.day");
	const timeReminder = t("promptUtils.gameContext.timeReminder", {
		day: state.day,
		phase: phaseText,
		seat: player.seat + 1,
		name: player.displayName,
	});

	context += `<current_status>\n${timeReminder}\n</current_status>

<game_state>
day: ${state.day}
phase: ${phaseText}
you: {seat: ${player.seat + 1}, name: ${player.displayName}}
total_seats: ${totalSeats}
alive: [${aliveSeats.join(", ")}]
dead: [${deadInfo.join(", ")}]
sheriff: ${sheriffInfo}
alive_count: ${alivePlayers.length}
</game_state>`;

	// Add alive players list for reference
	const playerList = alivePlayers
		.map(
			(p) =>
				`  - ${t("promptUtils.gameContext.seatLabel", { seat: p.seat + 1 })} ${p.displayName}${p.playerId === player.playerId ? t("promptUtils.gameContext.youSuffix") : ""}`,
		)
		.join("\n");
	context += `\n\n<alive_players>\n${playerList}\n</alive_players>`;

	const wolfFriendlyFireNote = t(
		"promptUtils.gameContext.wolfFriendlyFireNote",
	);
	const phaseOrderNote =
		state.day === 1
			? t("promptUtils.gameContext.phaseOrderNoteDay1BadgeBeforeDeath")
			: t("promptUtils.gameContext.phaseOrderNote");
	const noSameDayCausalityNote = state.phase.includes("DAY")
		? t("promptUtils.gameContext.noSameDayCausalityNote")
		: "";

	// Check if guard exists in this game
	const hasGuard = state.players.some((p) => p.role === "Guard");

	// Check if it's a peaceful night (no deaths today)
	const nightHistory = state.nightHistory?.[state.day];
	const isPeacefulNight =
		!options?.excludePendingDeaths &&
		state.phase.includes("DAY") &&
		nightHistory &&
		!nightHistory.wolfTarget &&
		!nightHistory.witchPoison &&
		(!nightHistory.deaths || nightHistory.deaths.length === 0);

	// Build rules text with phase order note always included
	let rulesText = wolfFriendlyFireNote;
	if (isPeacefulNight) {
		// Use different peaceful night note based on whether guard exists
		const peacefulNightNote = hasGuard
			? t("promptUtils.gameContext.peacefulNightNote")
			: t("promptUtils.gameContext.peacefulNightNoteNoGuard");
		rulesText += `\n${peacefulNightNote}`;
	}
	rulesText += `\n${phaseOrderNote}`;
	if (noSameDayCausalityNote) {
		rulesText += `\n${noSameDayCausalityNote}`;
	}

	if (rulesText) {
		context += `\n\n<rules>\n${rulesText}\n</rules>`;
	}

	const summarySection = buildDailySummariesSection(state);
	if (summarySection) {
		context += `\n\n${summarySection}`;
	}

	const systemAnnouncements = buildSystemAnnouncementsSinceDawn(state, 8);
	if (systemAnnouncements) {
		context += `\n\n<announcements>\n${systemAnnouncements}\n</announcements>`;
	}

	if (deadPlayers.length > 0) {
		// Build today's deaths info (skip if excludePendingDeaths is true - deaths not announced yet)
		if (!options?.excludePendingDeaths) {
			const currentDayDeaths: string[] = [];
			const nightHistory = state.nightHistory?.[state.day];
			if (nightHistory?.wolfTarget !== undefined) {
				const p = state.players.find((p) => p.seat === nightHistory.wolfTarget);
				if (p && !p.alive) {
					currentDayDeaths.push(
						`{seat: ${p.seat + 1}, name: ${p.displayName}, cause: ${publicGenericDeathCause}}`,
					);
				}
			}
			if (nightHistory?.witchPoison !== undefined) {
				const p = state.players.find(
					(p) => p.seat === nightHistory.witchPoison,
				);
				if (p && !p.alive) {
					currentDayDeaths.push(
						`{seat: ${p.seat + 1}, name: ${p.displayName}, cause: ${publicGenericDeathCause}}`,
					);
				}
			}
			if (nightHistory?.deaths && Array.isArray(nightHistory.deaths)) {
				nightHistory.deaths.forEach((death) => {
					if (death && typeof death.seat === "number") {
						const p = state.players.find((p) => p.seat === death.seat);
						if (p && !p.alive) {
							currentDayDeaths.push(
								`{seat: ${p.seat + 1}, name: ${p.displayName}, cause: ${publicGenericDeathCause}}`,
							);
						}
					}
				});
			}
			const dayHistory = state.dayHistory?.[state.day];
			if (
				dayHistory?.executed &&
				typeof dayHistory.executed.seat === "number"
			) {
				const executedSeat = dayHistory.executed.seat;
				const p = state.players.find((p) => p.seat === executedSeat);
				if (p) {
					currentDayDeaths.push(
						`{seat: ${p.seat + 1}, name: ${p.displayName}, cause: ${publicExecutionCause}}`,
					);
				}
			}

			if (currentDayDeaths.length > 0) {
				context += `\n\n<today_deaths>\n${currentDayDeaths.join("\n")}\n</today_deaths>`;
			}
		}

		// Dead players note - softer guideline, allow referencing death causes but focus on alive players
		context += `\n\n<focus_reminder>${t("promptUtils.gameContext.focusReminder")}</focus_reminder>`;
	}

	if (state.voteHistory && Object.keys(state.voteHistory).length > 0) {
		context += `\n\n<votes>`;
		const sheriffSeat = state.badge.holderSeat;
		const sheriffPlayer =
			sheriffSeat !== null
				? state.players.find((p) => p.seat === sheriffSeat)
				: null;
		const sheriffPlayerId = sheriffPlayer?.playerId;
		const currentDay = state.day;

		Object.entries(state.voteHistory)
			.sort(([a], [b]) => Number(a) - Number(b))
			.forEach(([day, votes]) => {
				const dayNum = Number(day);
				const isRecent = currentDay - dayNum <= 1; // Recent 2 days show details

				const voteGroups: Record<number, number[]> = {};
				Object.entries(votes).forEach(([voterId, targetSeat]) => {
					const voter = state.players.find((p) => p.playerId === voterId);
					if (voter) {
						if (!voteGroups[targetSeat]) voteGroups[targetSeat] = [];
						voteGroups[targetSeat].push(voter.seat);
					}
				});

				// Sort by vote count descending
				const sortedTargets = Object.entries(voteGroups)
					.map(([target, voters]) => {
						const weightedVotes = voters.reduce((sum, seat) => {
							const voter = state.players.find((p) => p.seat === seat);
							if (!voter) return sum;
							return sum + (voter.playerId === sheriffPlayerId ? 1.5 : 1);
						}, 0);
						return { target: Number(target), voters, weightedVotes };
					})
					.sort((a, b) => b.weightedVotes - a.weightedVotes);

				if (isRecent) {
					// Recent days: show full details in YAML format
					context += `\nday_${day}:`;
					sortedTargets.forEach(({ target, voters, weightedVotes }) => {
						const targetPlayer = state.players.find((p) => p.seat === target);
						const voteLabel = Number.isInteger(weightedVotes)
							? `${weightedVotes}`
							: weightedVotes.toFixed(1);
						const voterList = voters.map((s) => s + 1).join(",");
						context += `\n  ${t("promptUtils.gameContext.seatLabel", { seat: target + 1 })}${targetPlayer?.displayName || ""}: {${t("promptUtils.gameContext.voteCount")}: ${voteLabel}, ${t("promptUtils.gameContext.voters")}: [${voterList}]}`;
					});
				} else {
					// Older days: compressed summary
					const dayHistory = state.dayHistory?.[dayNum];
					if (dayHistory?.executed) {
						const executedSeat = dayHistory.executed.seat;
						const executedPlayer = state.players.find(
							(p) => p.seat === executedSeat,
						);
						const topVoter = sortedTargets[0]?.voters[0];
						const leaderSeat = topVoter !== undefined ? topVoter + 1 : null;
						context += `\nday_${day}: {${t("promptUtils.gameContext.eliminated").trim()}: ${t("promptUtils.gameContext.seatLabel", { seat: executedSeat + 1 })}${executedPlayer?.displayName || ""}, ${t("promptUtils.gameContext.voteCount")}: ${dayHistory.executed.votes}${leaderSeat ? `, ${t("promptUtils.gameContext.mainVoter")}: ${t("promptUtils.gameContext.seatLabel", { seat: leaderSeat })}` : ""}}`;
					} else if (dayHistory?.voteTie) {
						context += `\nday_${day}: {${t("promptUtils.gameContext.result")}: ${t("promptUtils.gameContext.tie")}}`;
					} else if (sortedTargets.length > 0) {
						// 即使没有 dayHistory，也显示投票信息（防止投票信息丢失）
						const topTarget = sortedTargets[0];
						const targetPlayer = state.players.find(
							(p) => p.seat === topTarget.target,
						);
						const topVoter = topTarget.voters[0];
						const leaderSeat = topVoter !== undefined ? topVoter + 1 : null;
						const voteLabel = Number.isInteger(topTarget.weightedVotes)
							? `${topTarget.weightedVotes}`
							: topTarget.weightedVotes.toFixed(1);
						context += `\nday_${day}: {${t("promptUtils.gameContext.eliminated").trim()}: ${t("promptUtils.gameContext.seatLabel", { seat: topTarget.target + 1 })}${targetPlayer?.displayName || ""}, ${t("promptUtils.gameContext.voteCount")}: ${voteLabel}${leaderSeat ? `, ${t("promptUtils.gameContext.mainVoter")}: ${t("promptUtils.gameContext.seatLabel", { seat: leaderSeat })}` : ""}}`;
					}
				}
			});
		context += `\n</votes>`;
	}

	// NOTE: Role-specific private information is now at the TOP of the context
	// via buildRolePrivateInfo() to ensure AI sees it first.

	// NOTE: We intentionally do NOT include <current_votes> during DAY_VOTE phase.
	// Showing real-time votes to later voters causes a "bandwagon effect" where
	// AI players follow earlier votes instead of making independent decisions
	// based on their own analysis and speeches.

	return context;
};

/**
 * Build a system message with cache control for static content.
 * Splits the system prompt into cacheable (static rules) and non-cacheable (dynamic state) parts.
 *
 * @param cacheableContent - Static content that can be cached (role rules, win conditions, etc.)
 * @param dynamicContent - Dynamic content that changes per request (game state, player-specific info)
 * @param useCache - Whether to enable caching (default: true)
 * @param ttl - Cache TTL: "5m" (default) or "1h"
 * @returns LLMMessage with cache_control breakpoints
 */
export function buildSystemTextFromParts(parts: SystemPromptPart[]): string {
	return parts
		.map((part) => part.text)
		.map((text) => text.trim())
		.filter(Boolean)
		.join("\n\n");
}

export function buildCachedSystemMessageFromParts(
	parts: SystemPromptPart[] | undefined,
	fallbackSystem: string,
	useCache: boolean = true,
): LLMMessage {
	if (!parts || parts.length === 0 || !useCache) {
		return { role: "system", content: fallbackSystem };
	}

	let cacheCount = 0;
	const contentParts: Array<{
		type: "text";
		text: string;
		cache_control?: { type: "ephemeral"; ttl?: "1h" };
	}> = [];

	parts.forEach((part) => {
		const text = part.text.trim();
		if (!text) return;
		const cacheable = part.cacheable === true;
		const allowCache = cacheable && cacheCount < 4;
		const cache_control = allowCache
			? {
					type: "ephemeral" as const,
					...(part.ttl === "1h" ? { ttl: "1h" as const } : {}),
				}
			: undefined;

		if (allowCache) cacheCount += 1;

		contentParts.push({
			type: "text",
			text,
			...(cache_control ? { cache_control } : {}),
		});
	});

	if (contentParts.length === 0) {
		return { role: "system", content: fallbackSystem };
	}

	return {
		role: "system",
		content: contentParts,
	};
}
