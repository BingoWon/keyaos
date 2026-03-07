export const REFERRAL_QUERY_PARAM = "ref" as const;
export const REFERRAL_STORAGE_KEY = "wolfcha_referral" as const;

export const readReferralFromSearchParams = (
	searchParams: URLSearchParams,
): string | null => {
	const raw = searchParams.get(REFERRAL_QUERY_PARAM);
	if (!raw) return null;
	const trimmed = raw.trim();
	return trimmed ? trimmed : null;
};

export const readReferralFromStorage = (): string | null => {
	if (typeof window === "undefined") return null;
	try {
		const raw = window.localStorage.getItem(REFERRAL_STORAGE_KEY);
		if (!raw) return null;
		const trimmed = raw.trim();
		return trimmed ? trimmed : null;
	} catch {
		return null;
	}
};

export const writeReferralToStorage = (referralCode: string): void => {
	if (typeof window === "undefined") return;
	try {
		window.localStorage.setItem(REFERRAL_STORAGE_KEY, referralCode);
	} catch {
		return;
	}
};

export const removeReferralFromStorage = (): void => {
	if (typeof window === "undefined") return;
	try {
		window.localStorage.removeItem(REFERRAL_STORAGE_KEY);
	} catch {
		return;
	}
};

export const persistReferralFromCurrentUrl = (): string | null => {
	if (typeof window === "undefined") return null;
	try {
		const url = new URL(window.location.href);
		const referralCode = readReferralFromSearchParams(url.searchParams);
		if (!referralCode) return null;
		writeReferralToStorage(referralCode);
		return referralCode;
	} catch {
		return null;
	}
};

export const removeReferralFromCurrentUrl = (): void => {
	if (typeof window === "undefined") return;
	try {
		const url = new URL(window.location.href);
		if (!url.searchParams.has(REFERRAL_QUERY_PARAM)) return;

		url.searchParams.delete(REFERRAL_QUERY_PARAM);

		const search = url.searchParams.toString();
		const next = `${url.pathname}${search ? `?${search}` : ""}${url.hash}`;
		window.history.replaceState({}, "", next);
	} catch {
		return;
	}
};

export const readReferralFromCurrentUrlOrStorage = (): string | null => {
	if (typeof window === "undefined") return null;
	try {
		const url = new URL(window.location.href);
		const fromUrl = readReferralFromSearchParams(url.searchParams);
		if (fromUrl) return fromUrl;
	} catch {
		return readReferralFromStorage();
	}
	return readReferralFromStorage();
};

export const buildBaseRedirectToFromCurrentUrl = (): string | undefined => {
	if (typeof window === "undefined") return undefined;
	try {
		const url = new URL(window.location.href);
		url.search = "";
		url.hash = "";
		return url.toString();
	} catch {
		return undefined;
	}
};

export const buildEmailRedirectToFromCurrentUrl = (): string | undefined => {
	const base = buildBaseRedirectToFromCurrentUrl();
	if (!base) return undefined;

	const referralCode = readReferralFromCurrentUrlOrStorage();
	if (!referralCode) return base;

	try {
		const url = new URL(base);
		url.searchParams.set(REFERRAL_QUERY_PARAM, referralCode);
		return url.toString();
	} catch {
		return base;
	}
};

export const buildReferralShareUrl = (
	origin: string,
	referralCode: string,
): string => {
	const url = new URL(origin);
	url.searchParams.set(REFERRAL_QUERY_PARAM, referralCode);
	return url.toString();
};
