import {
	createUIMessageStream,
	createUIMessageStreamResponse,
	type UIMessage,
} from "ai";
import { Hono } from "hono";
import { BadRequestError } from "../shared/errors";
import { log } from "../shared/logger";
import type { AppEnv } from "../shared/types";
import { executeCompletion } from "./gateway";

const chatApiRouter = new Hono<AppEnv>();

chatApiRouter.post("/", async (c) => {
	let body: Record<string, unknown>;
	try {
		body = await c.req.json();
	} catch {
		throw new BadRequestError("Invalid JSON body");
	}

	const messages = body.messages as UIMessage[] | undefined;
	const modelId = body.model as string | undefined;
	const system = body.system as string | undefined;

	if (!modelId) throw new BadRequestError("model is required");
	if (!messages?.length) throw new BadRequestError("messages is required");

	const openaiMessages: { role: string; content: string }[] = [];
	if (system) openaiMessages.push({ role: "system", content: system });

	for (const m of messages) {
		const text = Array.isArray(m.parts)
			? m.parts
					.filter((p): p is { type: "text"; text: string } => p.type === "text")
					.map((p) => p.text)
					.join("")
			: "";
		if (text) openaiMessages.push({ role: m.role, content: text });
	}

	log.info("chat-api", "Request received", {
		model: modelId,
		messageCount: openaiMessages.length,
		ownerId: c.get("owner_id"),
	});

	const textPartId = crypto.randomUUID();

	const stream = createUIMessageStream({
		execute: async ({ writer }) => {
			let result: Awaited<ReturnType<typeof executeCompletion>>;
			try {
				result = await executeCompletion(c, {
					model: modelId,
					body: { messages: openaiMessages, stream: true },
				});
			} catch (err) {
				const msg =
					err instanceof Error ? err.message : "Unknown gateway error";
				log.error("chat-api", "executeCompletion failed", {
					error: msg,
					stack: err instanceof Error ? err.stack : undefined,
					model: modelId,
				});
				writer.write({ type: "error", errorText: msg });
				return;
			}

			log.info("chat-api", "Upstream connected", {
				provider: result.provider,
				requestId: result.requestId,
				status: result.response.status,
				contentType: result.response.headers.get("content-type"),
			});

			const upstreamBody = result.response.body;
			if (!upstreamBody) {
				log.error("chat-api", "Upstream response has no body", {
					requestId: result.requestId,
				});
				writer.write({ type: "error", errorText: "Upstream returned empty body" });
				return;
			}

			const contentType = result.response.headers.get("content-type") || "";

			if (contentType.includes("application/json")) {
				const json = await result.response.json() as Record<string, unknown>;
				const text =
					(json.choices as { message?: { content?: string } }[] | undefined)?.[0]
						?.message?.content ?? "";
				if (text) {
					writer.write({ type: "text-start", id: textPartId });
					writer.write({ type: "text-delta", delta: text, id: textPartId });
					writer.write({ type: "text-end", id: textPartId });
				} else if (json.error) {
					const errObj = json.error as { message?: string };
					writer.write({
						type: "error",
						errorText: errObj.message || JSON.stringify(json.error),
					});
					return;
				}
				writer.write({ type: "finish-step" });
				writer.write({ type: "finish", finishReason: "stop" });
				return;
			}

			writer.write({ type: "text-start", id: textPartId });

			const reader = upstreamBody.getReader();
			const decoder = new TextDecoder();
			let buffer = "";
			let chunkCount = 0;

			for (;;) {
				const { done, value } = await reader.read();
				if (done) break;

				buffer += decoder.decode(value, { stream: true });
				const lines = buffer.split("\n");
				buffer = lines.pop()!;

				for (const line of lines) {
					if (!line.startsWith("data: ")) continue;
					const payload = line.slice(6).trim();
					if (payload === "[DONE]") continue;

					try {
						const json = JSON.parse(payload);
						const delta = json.choices?.[0]?.delta?.content;
						if (delta) {
							writer.write({ type: "text-delta", delta, id: textPartId });
							chunkCount++;
						}
					} catch {
						log.warn("chat-api", "SSE chunk parse error", {
							payload: payload.slice(0, 200),
						});
					}
				}
			}

			log.info("chat-api", "Stream complete", {
				requestId: result.requestId,
				chunkCount,
			});

			writer.write({ type: "text-end", id: textPartId });
			writer.write({ type: "finish-step" });
			writer.write({ type: "finish", finishReason: "stop" });
		},
		onError: (error) => {
			const msg = error instanceof Error ? error.message : String(error);
			log.error("chat-api", "Stream error", { error: msg });
			return msg;
		},
	});

	return createUIMessageStreamResponse({ stream });
});

export default chatApiRouter;
