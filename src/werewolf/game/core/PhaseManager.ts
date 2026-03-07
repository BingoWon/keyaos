import type { Phase, Player } from "@wolf/types/game";
import { BadgePhase } from "../phases/BadgePhase";
import { DaySpeechPhase } from "../phases/DaySpeechPhase";
import { HunterPhase } from "../phases/HunterPhase";
import { NightPhase } from "../phases/NightPhase";
import { VotePhase } from "../phases/VotePhase";
import { WhiteWolfKingBoomPhase } from "../phases/WhiteWolfKingBoomPhase";
import type { GamePhase } from "./GamePhase";
import type { GameContext, PromptResult } from "./types";

export class PhaseManager {
	private readonly phases: Partial<Record<Phase, GamePhase>>;

	constructor() {
		const nightPhase = new NightPhase();
		const votePhase = new VotePhase();
		const daySpeechPhase = new DaySpeechPhase();
		const badgePhase = new BadgePhase();
		const hunterPhase = new HunterPhase();
		const whiteWolfKingBoomPhase = new WhiteWolfKingBoomPhase();
		this.phases = {
			NIGHT_START: nightPhase,
			NIGHT_GUARD_ACTION: nightPhase,
			NIGHT_WOLF_ACTION: nightPhase,
			NIGHT_WITCH_ACTION: nightPhase,
			NIGHT_SEER_ACTION: nightPhase,
			DAY_VOTE: votePhase,
			DAY_SPEECH: daySpeechPhase,
			DAY_LAST_WORDS: daySpeechPhase,
			DAY_BADGE_SPEECH: daySpeechPhase,
			DAY_PK_SPEECH: daySpeechPhase,
			DAY_BADGE_SIGNUP: badgePhase,
			DAY_BADGE_ELECTION: badgePhase,
			BADGE_TRANSFER: badgePhase,
			HUNTER_SHOOT: hunterPhase,
			WHITE_WOLF_KING_BOOM: whiteWolfKingBoomPhase,
		};
	}

	getPhase(phase: Phase): GamePhase | null {
		return this.phases[phase] ?? null;
	}

	getPrompt(
		phase: Phase,
		context: GameContext,
		player: Player,
	): PromptResult | null {
		const phaseImpl = this.getPhase(phase);
		if (!phaseImpl) return null;
		return phaseImpl.getPrompt(context, player);
	}
}
