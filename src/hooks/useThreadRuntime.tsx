import {
	type GenericThreadHistoryAdapter,
	type MessageFormatAdapter,
	type MessageFormatItem,
	type MessageFormatRepository,
	type MessageStorageEntry,
	type unstable_RemoteThreadListAdapter as RemoteThreadListAdapter,
	RuntimeAdapterProvider,
	type ThreadHistoryAdapter,
	useAui,
	unstable_useRemoteThreadListRuntime as useRemoteThreadListRuntime,
} from "@assistant-ui/react";
import {
	type AssistantChatTransport,
	useChatRuntime,
} from "@assistant-ui/react-ai-sdk";
import {
	type FC,
	type ReactNode,
	useCallback,
	useMemo,
	useRef,
	useState,
	useSyncExternalStore,
} from "react";

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

type AdapterOpts = {
	apiBase: string;
	getHeaders: () => Promise<Record<string, string>>;
	getModel: () => string;
};

// ---------------------------------------------------------------------------
// Thread metadata caches (module-level)
// ---------------------------------------------------------------------------
const _modelMap = new Map<string, string>();
const _timestampMap = new Map<string, number>();

export function getThreadTimestamp(remoteId: string): number | undefined {
	return _timestampMap.get(remoteId);
}

// ---------------------------------------------------------------------------
// In-memory message cache (LRU, module-level)
// ---------------------------------------------------------------------------
type RawMessage = {
	id: string;
	role: string;
	parts: unknown[];
	createdAt: string;
};

const _messageCache = new Map<string, RawMessage[]>();
const MAX_CACHED_THREADS = 50;

function setMessageCache(remoteId: string, messages: RawMessage[]) {
	_messageCache.delete(remoteId);
	_messageCache.set(remoteId, messages);
	if (_messageCache.size > MAX_CACHED_THREADS) {
		const oldest = _messageCache.keys().next().value;
		if (oldest) _messageCache.delete(oldest);
	}
}
let _activeModel: string | null = null;
const _listeners = new Set<() => void>();

function _notify() {
	for (const cb of _listeners) cb();
}

function setActiveThreadModel(model: string | null) {
	if (model === _activeModel) return;
	_activeModel = model;
	_notify();
}

function _subscribe(cb: () => void) {
	_listeners.add(cb);
	return () => _listeners.delete(cb);
}

function _getSnapshot() {
	return _activeModel;
}

export function useActiveThreadModel(): string | null {
	return useSyncExternalStore(_subscribe, _getSnapshot);
}

export function activateThreadModel(remoteId: string): void {
	setActiveThreadModel(_modelMap.get(remoteId) ?? null);
}

// ---------------------------------------------------------------------------
// History adapter
// ---------------------------------------------------------------------------
function useKeyaosHistoryAdapter(
	optsRef: React.RefObject<AdapterOpts>,
): ThreadHistoryAdapter {
	// biome-ignore lint/correctness/useHookAtTopLevel: called inside KeyaosHistoryProvider component
	const aui = useAui();

	// biome-ignore lint/correctness/useHookAtTopLevel: called inside KeyaosHistoryProvider component
	return useMemo((): ThreadHistoryAdapter => {
		const h = () => optsRef.current.getHeaders();
		const b = () => optsRef.current.apiBase;

		return {
			async load() {
				return { messages: [] };
			},
			async append() {},
			withFormat<TMessage, TStorageFormat extends Record<string, unknown>>(
				formatAdapter: MessageFormatAdapter<TMessage, TStorageFormat>,
			): GenericThreadHistoryAdapter<TMessage> {
				function decodeRaw(
					raw: RawMessage[],
				): MessageFormatRepository<TMessage> {
					if (!raw.length) return { messages: [] };
					let lastId: string | null = null;
					const messages = raw.map((m) => {
						const entry: MessageStorageEntry<TStorageFormat> = {
							id: m.id,
							parent_id: lastId,
							format: formatAdapter.format,
							content: {
								role: m.role,
								parts: m.parts,
							} as unknown as TStorageFormat,
						};
						lastId = m.id;
						return formatAdapter.decode(entry);
					});
					const lastMsg = messages.at(-1);
					return {
						headId: lastMsg ? formatAdapter.getId(lastMsg.message) : undefined,
						messages,
					};
				}

				return {
					async load(): Promise<MessageFormatRepository<TMessage>> {
						const remoteId = aui.threadListItem().getState().remoteId;
						if (!remoteId) return { messages: [] };

						const cached = _messageCache.get(remoteId);

						const doFetch = async (): Promise<RawMessage[]> => {
							const headers = await h();
							const data = await fetchApi<{
								messages: RawMessage[];
							}>(`${b()}/${remoteId}/messages`, headers);
							const raw = data.messages ?? [];
							setMessageCache(remoteId, raw);
							return raw;
						};

						if (cached) {
							doFetch().catch(() => {});
							return decodeRaw(cached);
						}

						return decodeRaw(await doFetch());
					},

					async append(item: MessageFormatItem<TMessage>) {
						const remoteId = aui.threadListItem().getState().remoteId;
						if (!remoteId) return;

						const encoded = formatAdapter.encode(item);
						const id = formatAdapter.getId(item.message);
						const raw: RawMessage = {
							id,
							role: (encoded as Record<string, unknown>).role as string,
							parts: (encoded as Record<string, unknown>).parts as unknown[],
							createdAt: new Date().toISOString(),
						};

						const cached = _messageCache.get(remoteId);
						if (cached) {
							const idx = cached.findIndex((m) => m.id === id);
							if (idx !== -1) {
								cached[idx] = raw;
							} else {
								cached.push(raw);
							}
						} else {
							setMessageCache(remoteId, [raw]);
						}
					},
				};
			},
		};
	}, [aui, optsRef]);
}

// ---------------------------------------------------------------------------
// Title helpers
// ---------------------------------------------------------------------------
function buildFallbackTitleStream(title: string): ReadableStream {
	return new ReadableStream({
		start(ctrl) {
			ctrl.enqueue({ type: "part-start", part: { type: "text" }, path: [0] });
			ctrl.enqueue({ type: "text-delta", textDelta: title, path: [0] });
			ctrl.enqueue({ type: "part-finish", path: [0] });
			ctrl.close();
		},
	});
}

// ---------------------------------------------------------------------------
// Adapter hook
// ---------------------------------------------------------------------------
export function useThreadListAdapter(
	opts: AdapterOpts,
): RemoteThreadListAdapter {
	const optsRef = useRef(opts);
	optsRef.current = opts;

	const unstable_Provider: FC<{ children: ReactNode }> = useCallback(
		function KeyaosHistoryProvider({ children }: { children: ReactNode }) {
			// biome-ignore lint/correctness/useHookAtTopLevel: KeyaosHistoryProvider is a React component
			const history = useKeyaosHistoryAdapter(optsRef);
			// biome-ignore lint/correctness/useHookAtTopLevel: KeyaosHistoryProvider is a React component
			const adapters = useMemo(() => ({ history }), [history]);
			return (
				<RuntimeAdapterProvider adapters={adapters}>
					{children}
				</RuntimeAdapterProvider>
			);
		},
		[],
	);

	const [adapter] = useState<RemoteThreadListAdapter>(() => {
		const h = () => optsRef.current.getHeaders();
		const b = () => optsRef.current.apiBase;
		const m = () => optsRef.current.getModel();

		return {
			list: async () => {
				const data = await fetchApi<{
					threads: Array<{
						remoteId: string;
						status: string;
						title?: string;
						model_id?: string;
						updated_at?: number;
					}>;
				}>(b(), await h());
				for (const t of data.threads) {
					if (t.model_id) _modelMap.set(t.remoteId, t.model_id);
					if (t.updated_at) _timestampMap.set(t.remoteId, t.updated_at);
				}
				return data;
			},
			initialize: async (threadId) => {
				setActiveThreadModel(null);
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
				_messageCache.delete(remoteId);
			},
			generateTitle: async (remoteId, messages) => {
				const condensed = (
					messages as {
						role: string;
						content?: { type: string; text?: string }[];
					}[]
				)
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
					const titleModel = m();
					if (!titleModel) {
						return buildFallbackTitleStream("New Thread");
					}
					const data = await fetchApi<{ title: string }>(
						`${b()}/${remoteId}/generate-title`,
						await h(),
						{
							method: "POST",
							body: JSON.stringify({
								messages: condensed,
								model_id: titleModel,
							}),
						},
					);
					return buildFallbackTitleStream(data.title || "New Thread");
				} catch (err) {
					console.error("[generateTitle] failed for thread", remoteId, err);
					return buildFallbackTitleStream("New Thread");
				}
			},
			fetch: async (threadId) => {
				const data = await fetchApi<{
					remoteId: string;
					status: string;
					title?: string;
					model_id?: string;
				}>(`${b()}/${threadId}`, await h());
				if (data.model_id) _modelMap.set(data.remoteId, data.model_id);
				setActiveThreadModel(
					data.model_id ?? _modelMap.get(data.remoteId) ?? null,
				);
				return data;
			},
			unstable_Provider,
		};
	});

	return adapter;
}

// ---------------------------------------------------------------------------
// Runtime hook
// ---------------------------------------------------------------------------
export function useKeyaosRuntime(opts: {
	transport: AssistantChatTransport;
	adapter: RemoteThreadListAdapter;
}) {
	return useRemoteThreadListRuntime({
		runtimeHook: function RuntimeHook() {
			// biome-ignore lint/correctness/useHookAtTopLevel: RuntimeHook is a React component per library API
			return useChatRuntime({ transport: opts.transport });
		},
		adapter: opts.adapter,
	});
}
