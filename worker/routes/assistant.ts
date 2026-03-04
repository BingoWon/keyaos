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

const assistantRouter = new Hono<AppEnv>();

assistantRouter.post("/", async (c) => {
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

	log.info("assistant", "Request", {
		model: modelId,
		msgs: openaiMessages.length,
	});

	const partId = crypto.randomUUID();

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
				log.error("assistant", "Gateway error", { error: msg, model: modelId });
				writer.write({ type: "error", errorText: msg });
				return;
			}

			const upstream = result.response;
			log.info("assistant", "Streaming", {
				provider: result.provider,
				reqId: result.requestId,
			});

			if (!upstream.body) {
				writer.write({ type: "error", errorText: "Empty upstream body" });
				return;
			}

			writer.write({ type: "text-start", id: partId });

			const reader = upstream.body.getReader();
			const decoder = new TextDecoder();
			let buf = "";

			for (;;) {
				const { done, value } = await reader.read();
				if (done) break;

				buf += decoder.decode(value, { stream: true });
				const lines = buf.split("\n");
				buf = lines.pop()!;

				for (const line of lines) {
					if (!line.startsWith("data: ")) continue;
					const payload = line.slice(6).trim();
					if (payload === "[DONE]") continue;

					try {
						const delta = JSON.parse(payload).choices?.[0]?.delta?.content;
						if (delta) {
							writer.write({ type: "text-delta", delta, id: partId });
						}
					} catch {}
				}
			}

			writer.write({ type: "text-end", id: partId });
			writer.write({ type: "finish-step" });
			writer.write({ type: "finish", finishReason: "stop" });
		},
		onError: (error) => {
			const msg = error instanceof Error ? error.message : String(error);
			log.error("assistant", "Stream error", { error: msg });
			return msg;
		},
	});

	return createUIMessageStreamResponse({ stream });
});

export default assistantRouter;
