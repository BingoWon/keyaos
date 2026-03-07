import type { CustomCharacterInput } from "@wolf/types/custom-character";
import { FIELD_LIMITS, MBTI_OPTIONS } from "@wolf/types/custom-character";

const DEFAULT_BASIC_INFO_POOL = [
	"上班族，逻辑清晰，喜欢推理",
	"学生党，直觉强，善于观察",
	"社交达人，擅长带节奏",
	"话不多但关键点很准",
	"喜欢复盘总结，发言有条理",
	"情绪稳定，偏理性分析",
	"容易共情，偏感性判断",
	"谨慎保守，倾向稳健站边",
] as const;

const DEFAULT_STYLE_LABEL_POOL = [
	"逻辑",
	"谨慎",
	"稳健",
	"简洁",
	"强势",
	"温和",
	"活泼",
	"冷静",
] as const;

const MBTI_POOL = MBTI_OPTIONS.filter((m) => Boolean(m)) as readonly string[];

function pickRandomFromPool<T>(pool: readonly T[]): T {
	const idx = Math.floor(Math.random() * pool.length);
	return pool[idx] as T;
}

function clampTextLength(text: string, max: number): string {
	const t = String(text ?? "").trim();
	return t.length > max ? t.slice(0, max) : t;
}

function normalizeMbti(raw: string): string {
	const upper = String(raw ?? "")
		.trim()
		.toUpperCase();
	const isFourLetters = /^[A-Z]{4}$/.test(upper);
	if (isFourLetters && MBTI_POOL.includes(upper)) return upper;
	return pickRandomFromPool(MBTI_POOL).toString();
}

export function fillCustomCharacterOptionalFields(
	input: CustomCharacterInput,
): CustomCharacterInput {
	const mbti = normalizeMbti(input.mbti);

	const basicInfoRaw = String(input.basic_info ?? "").trim();
	const basic_info = clampTextLength(
		basicInfoRaw || pickRandomFromPool(DEFAULT_BASIC_INFO_POOL),
		FIELD_LIMITS.basic_info.max,
	);

	const styleLabelRaw = String(input.style_label ?? "").trim();
	const style_label = clampTextLength(
		styleLabelRaw || pickRandomFromPool(DEFAULT_STYLE_LABEL_POOL),
		FIELD_LIMITS.style_label.max,
	);

	return {
		...input,
		mbti,
		basic_info,
		style_label,
	};
}
