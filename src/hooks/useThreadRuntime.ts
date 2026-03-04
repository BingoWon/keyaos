import {
	unstable_useRemoteThreadListRuntime as useRemoteThreadListRuntime,
	type unstable_RemoteThreadListAdapter as RemoteThreadListAdapter,
} from "@assistant-ui/react";
import {
	type AssistantChatTransport,
	useChatRuntime,
} from "@assistant-ui/react-ai-sdk";
import { useMemo, useRef } from "react";

async function fetchApi<T>(
	url: string,
	headers: Record<string, string>,
	init?: RequestInit,
): Promise<T> {
	const res = await fetch(url, {
		...init,
		headers: {
			"Content-Type": "application/json",
			...headers,
			...init?.headers,
		},
	});
	if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
	return res.json() as Promise<T>;
}

export function useThreadListAdapter(opts: {
	apiBase: string;
	getHeaders: () => Promise<Record<string, string>>;
}): RemoteThreadListAdapter {
	const optsRef = useRef(opts);
	optsRef.current = opts;

	return useMemo<RemoteThreadListAdapter>(() => {
		const h = () => optsRef.current.getHeaders();
		const b = () => optsRef.current.apiBase;

		return {
			list: async () => fetchApi(b(), await h()),
			initialize: async (threadId) => {
				return fetchApi(b(), await h(), {
					method: "POST",
					body: JSON.stringify({ threadId }),
				});
			},
			rename: async (remoteId, newTitle) => {
				await fetchApi(`${b()}/${remoteId}/rename`, await h(), {
					method: "PATCH",
					body: JSON.stringify({ title: newTitle }),
				});
			},
			archive: async (remoteId) => {
				await fetchApi(`${b()}/${remoteId}/archive`, await h(), {
					method: "PATCH",
				});
			},
			unarchive: async (remoteId) => {
				await fetchApi(`${b()}/${remoteId}/unarchive`, await h(), {
					method: "PATCH",
				});
			},
			delete: async (remoteId) => {
				await fetchApi(`${b()}/${remoteId}`, await h(), {
					method: "DELETE",
				});
			},
			generateTitle: async (remoteId, messages) => {
				const hd = await h();
				const condensed = (messages as { role: string; content?: { type: string; text?: string }[] }[])
					.slice(0, 4)
					.map((m) => ({
						role: m.role,
						content: Array.isArray(m.content)
							? m.content
								.filter((p) => p.type === "text")
								.map((p) => p.text ?? "")
								.join("")
							: String(m.content ?? ""),
					}));
				try {
					const res = await fetchApi<{ title: string }>(
						`${b()}/${remoteId}/generate-title`,
						hd,
						{
							method: "POST",
							body: JSON.stringify({ messages: condensed }),
						},
					);
					const enc = new TextEncoder();
					return new ReadableStream({
						start(ctrl) {
							ctrl.enqueue(enc.encode(res.title));
							ctrl.close();
						},
					}) as never;
				} catch {
					return new ReadableStream({
						start(ctrl) { ctrl.close(); },
					}) as never;
				}
			},
			fetch: async (threadId) => fetchApi(`${b()}/${threadId}`, await h()),
		};
	}, []);
}

export function useKeyaosRuntime(opts: {
	transport: AssistantChatTransport;
	adapter: RemoteThreadListAdapter;
}) {
	return useRemoteThreadListRuntime({
		runtimeHook: function RuntimeHook() {
			return useChatRuntime({ transport: opts.transport });
		},
		adapter: opts.adapter,
	});
}
