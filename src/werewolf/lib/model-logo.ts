import type { ModelRef } from "@wolf/types/game";

const MODEL_LOGO_MAP: Array<{ match: RegExp; key: string }> = [
	{ match: /gemini/i, key: "gemini" },
	{ match: /deepseek/i, key: "deepseek" },
	{ match: /claude/i, key: "claude" },
	{ match: /qwen/i, key: "qwen" },
	{ match: /glm|z-ai/i, key: "glm" },
	{ match: /minimax/i, key: "minimax" },
	{ match: /doubao/i, key: "doubao" },
	{ match: /bytedance|seed/i, key: "bytedance" },
	{ match: /openai|gpt/i, key: "openai" },
	{ match: /kimi|moonshot/i, key: "kimi" },
];

export function getModelLogoPath(modelRef?: ModelRef): string {
	const modelName = modelRef?.model ?? "";
	const match = MODEL_LOGO_MAP.find((entry) => entry.match.test(modelName));
	return `/game/models/${match?.key ?? "openai"}.svg`;
}
