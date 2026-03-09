/**
 * useGameGate — checks whether the current user can start a game.
 *
 * Returns auth state (from Clerk) and resource availability
 * (wallet balance + healthy credentials from the Keyaos API).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/auth";

export type GateReason = "auth" | "resources" | null;

interface ResourceState {
	balance: number;
	healthyCredentials: number;
}

export function useGameGate() {
	const { isLoaded, isSignedIn, getToken, signOut } = useAuth();
	const [resources, setResources] = useState<ResourceState | null>(null);
	const [loading, setLoading] = useState(false);
	const fetchedRef = useRef(false);

	const fetchResources = useCallback(async () => {
		if (!isSignedIn) return;
		setLoading(true);
		try {
			const token = await getToken();
			const headers: Record<string, string> = token
				? { Authorization: `Bearer ${token}` }
				: {};
			const [statsRes, balanceRes] = await Promise.all([
				fetch("/api/pool/stats", { headers }),
				fetch("/api/credits/balance", { headers }),
			]);
			const stats = statsRes.ok
				? ((await statsRes.json()) as { healthyCredentials: number })
				: { healthyCredentials: 0 };
			const wallet = balanceRes.ok
				? ((await balanceRes.json()) as { balance: number })
				: { balance: 0 };
			setResources({
				balance: wallet.balance ?? 0,
				healthyCredentials: stats.healthyCredentials ?? 0,
			});
		} catch {
			setResources({ balance: 0, healthyCredentials: 0 });
		} finally {
			setLoading(false);
		}
	}, [isSignedIn, getToken]);

	useEffect(() => {
		if (!isSignedIn || fetchedRef.current) return;
		fetchedRef.current = true;
		void fetchResources();
	}, [isSignedIn, fetchResources]);

	useEffect(() => {
		if (!isSignedIn) {
			fetchedRef.current = false;
			setResources(null);
		}
	}, [isSignedIn]);

	const hasResources =
		resources !== null &&
		(resources.balance > 0 || resources.healthyCredentials > 0);

	const check = useCallback((): GateReason => {
		if (!isSignedIn) return "auth";
		if (resources !== null && !hasResources) return "resources";
		return null;
	}, [isSignedIn, resources, hasResources]);

	return {
		isAuthLoaded: isLoaded,
		isSignedIn: isSignedIn ?? false,
		hasResources,
		balance: resources?.balance ?? 0,
		healthyCredentials: resources?.healthyCredentials ?? 0,
		loading: !isLoaded || loading,
		check,
		refresh: fetchResources,
		signOut,
	};
}
