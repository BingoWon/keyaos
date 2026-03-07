/**
 * i18n adapter — replaces next-intl's createTranslator with a lightweight
 * implementation that reads the same messages JSON files.
 * This is the ONLY file changed in the i18n layer.
 */
import type { AppLocale } from "./config";
import { getLocale } from "./locale-store";
import { getMessages } from "./messages";

function resolveKey(obj: Record<string, unknown>, key: string): unknown {
	const parts = key.split(".");
	let current: unknown = obj;
	for (const part of parts) {
		if (current == null || typeof current !== "object") return undefined;
		current = (current as Record<string, unknown>)[part];
	}
	return current;
}

function interpolate(
	template: string,
	values?: Record<string, unknown>,
): string {
	if (!values) return template;
	return template.replace(/\{(\w+)\}/g, (_, key) => {
		const val = values[key];
		return val !== undefined && val !== null ? String(val) : `{${key}}`;
	});
}

type TranslatorFn = (key: string, values?: Record<string, unknown>) => string;

export const getI18n = (
	locale?: AppLocale,
): { t: TranslatorFn; locale: AppLocale } => {
	const activeLocale = locale ?? getLocale();
	const messages = getMessages(activeLocale);

	const t: TranslatorFn = (key: string, values?: Record<string, unknown>) => {
		const resolved = resolveKey(
			messages as unknown as Record<string, unknown>,
			key,
		);
		if (typeof resolved === "string") return interpolate(resolved, values);
		// Fallback: return the key itself
		return key;
	};

	(t as TranslatorFn & { raw: (key: string) => unknown }).raw = (
		key: string,
	) => {
		const resolved = resolveKey(
			messages as unknown as Record<string, unknown>,
			key,
		);
		return resolved !== undefined ? resolved : key;
	};

	return { t, locale: activeLocale };
};
