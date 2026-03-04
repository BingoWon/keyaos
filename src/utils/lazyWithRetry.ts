import { type ComponentType, lazy } from "react";

const RETRY_KEY = "chunk-reload";

/**
 * Wraps React.lazy with automatic page reload on chunk load failure.
 * After a deployment, old chunk hashes no longer exist on the server.
 * First failure: silently reload the page (user sees a brief flash at most).
 * Second failure (after reload): surface the error to RouteError boundary.
 */
export function lazyWithRetry<T extends ComponentType<unknown>>(
	factory: () => Promise<{ default: T }>,
) {
	return lazy(async () => {
		try {
			const mod = await factory();
			return mod;
		} catch (err) {
			if (!sessionStorage.getItem(RETRY_KEY)) {
				sessionStorage.setItem(RETRY_KEY, "1");
				window.location.reload();
				return { default: (() => null) as unknown as T };
			}
			sessionStorage.removeItem(RETRY_KEY);
			throw err;
		}
	});
}

/** Call once on app boot to clear the retry flag after a successful load. */
export function clearChunkRetryFlag() {
	sessionStorage.removeItem(RETRY_KEY);
}
