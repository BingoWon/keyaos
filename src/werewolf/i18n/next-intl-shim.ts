/**
 * Shim for next-intl — provides useTranslations() and NextIntlClientProvider
 * so that all wolfcha component imports from "next-intl" resolve here
 * with zero changes to any component file.
 */
import type { ReactNode } from "react";
import { getI18n } from "./translator";

type TranslatorFn = ((
	key: string,
	values?: Record<string, unknown>,
) => string) & {
	raw: (key: string) => unknown;
	rich: (key: string, values?: Record<string, unknown>) => string;
};

export function useTranslations(namespace?: string): TranslatorFn {
	const { t: rootT } = getI18n();

	const t = ((key: string, values?: Record<string, unknown>) => {
		const fullKey = namespace ? `${namespace}.${key}` : key;
		return rootT(fullKey, values);
	}) as TranslatorFn;

	t.raw = (key: string) => {
		const fullKey = namespace ? `${namespace}.${key}` : key;
		return (
			(rootT as unknown as { raw: (k: string) => unknown }).raw?.(fullKey) ??
			rootT(fullKey)
		);
	};

	t.rich = (key: string, values?: Record<string, unknown>) => {
		const fullKey = namespace ? `${namespace}.${key}` : key;
		return rootT(fullKey, values);
	};

	return t;
}

export function NextIntlClientProvider({
	children,
}: {
	children: ReactNode;
	locale?: string;
	messages?: unknown;
}) {
	return children;
}

export function useLocale(): string {
	const { locale } = getI18n();
	return locale;
}

export function useMessages(): unknown {
	return {};
}
