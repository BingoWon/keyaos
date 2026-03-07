/**
 * Stub: Supabase is not used in Keyaos. This provides a no-op client
 * so existing code that references supabase doesn't crash at import time.
 */

const noop = () => Promise.resolve({ data: null, error: null });
const noopObj = new Proxy({} as Record<string, unknown>, {
	get:
		() =>
		(..._args: unknown[]) => ({
			select: noop,
			insert: noop,
			update: noop,
			delete: noop,
			eq: () => noopObj,
			single: noop,
			then: (fn: (v: unknown) => unknown) =>
				Promise.resolve({ data: null, error: null }).then(fn),
		}),
});

export const supabase = {
	auth: {
		getSession: () => Promise.resolve({ data: { session: null }, error: null }),
		getUser: () => Promise.resolve({ data: { user: null }, error: null }),
		signInWithPassword: noop,
		signUp: noop,
		signOut: noop,
		onAuthStateChange: (_cb: unknown) => ({
			data: { subscription: { unsubscribe: () => {} } },
		}),
		resetPasswordForEmail: noop,
		updateUser: noop,
	},
	from: (_table: string) => noopObj,
	rpc: noop,
} as unknown as {
	auth: Record<string, (...args: unknown[]) => unknown>;
	from: (t: string) => unknown;
	rpc: typeof noop;
};
