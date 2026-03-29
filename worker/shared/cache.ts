import { createMiddleware } from "hono/factory";
import type { AppEnv } from "./types";

/**
 * Edge-cache middleware using the Workers Cache API.
 * Caches successful JSON responses for `ttl` seconds, keyed by full request URL.
 * Shared across all users — only use for public/global data endpoints.
 *
 * Browser caching is explicitly disabled (`no-store`) so the browser always
 * sends a real request to the CDN edge, which serves from Workers Cache API.
 *
 * On custom domains the Cache API is functional; on *.workers.dev it no-ops
 * silently (cache.match returns undefined, cache.put is ignored).
 */
export const edgeCache = (ttl = 60) =>
	createMiddleware<AppEnv>(async (c, next) => {
		const cache = caches.default;
		const key = new Request(c.req.url, { method: "GET" });

		const hit = await cache.match(key);
		if (hit) {
			const res = new Response(hit.body, hit);
			res.headers.set("Cache-Control", "no-store");
			return res;
		}

		await next();

		// Prevent browser from heuristic-caching the JSON response
		c.header("Cache-Control", "no-store");

		if (c.res.ok) {
			const cached = new Response(c.res.clone().body, {
				headers: {
					"Content-Type": "application/json",
					"Cache-Control": `s-maxage=${ttl}`,
				},
			});
			c.executionCtx.waitUntil(cache.put(key, cached));
		}
	});

/**
 * Purge edge-cached public endpoints after admin-triggered sync.
 * Only affects the current colo — other edge nodes expire via TTL.
 */
const PUBLIC_PATHS = [
	"/api/models",
	"/api/providers",
	"/api/providers?all=1",
	"/api/catalog",
	"/api/sparklines/model:input",
	"/api/sparklines/model:output",
	"/api/sparklines/provider",
	"/api/sparklines/provider?sample=900000",
	"/v1/models",
];

export async function purgePublicCaches(origin: string): Promise<number> {
	const cache = caches.default;
	let purged = 0;
	for (const path of PUBLIC_PATHS) {
		const deleted = await cache.delete(new Request(`${origin}${path}`));
		if (deleted) purged++;
	}
	return purged;
}
