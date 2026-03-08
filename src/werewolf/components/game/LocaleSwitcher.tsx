import { Globe } from "@phosphor-icons/react";
import type { AppLocale } from "@wolf/i18n/config";
import { useAppLocale } from "@wolf/i18n/useAppLocale";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";

const LOCALES: { value: AppLocale; label: string }[] = [
	{ value: "zh", label: "中文" },
	{ value: "en", label: "English" },
];

interface LocaleSwitcherProps {
	className?: string;
}

export function LocaleSwitcher({ className = "" }: LocaleSwitcherProps) {
	const t = useTranslations();
	const { locale, setLocale } = useAppLocale();
	const [isOpen, setIsOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				containerRef.current &&
				!containerRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
			}
		};

		if (isOpen) {
			document.addEventListener("mousedown", handleClickOutside);
		}
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [isOpen]);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				setIsOpen(false);
			}
		};

		if (isOpen) {
			document.addEventListener("keydown", handleKeyDown);
		}
		return () => {
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [isOpen]);

	const handleSelect = (value: AppLocale) => {
		setLocale(value);
		setIsOpen(false);
	};

	const currentLocale = LOCALES.find((l) => l.value === locale) ?? LOCALES[0];

	return (
		<div ref={containerRef} className={`relative ${className}`}>
			<Button
				type="button"
				variant="outline"
				onClick={() => setIsOpen(!isOpen)}
				className="h-8 text-xs gap-2"
				aria-label={t("locale.label")}
				aria-expanded={isOpen}
				aria-haspopup="listbox"
			>
				<Globe size={16} />
				{currentLocale.value === "zh" ? t("locale.zh") : t("locale.en")}
			</Button>

			{isOpen && (
				<div
					className="absolute right-0 top-full mt-1.5 z-50 min-w-[120px] overflow-hidden rounded-md border-2 border-[var(--border-color)] bg-[var(--bg-card)] shadow-lg"
					role="listbox"
					aria-label={t("locale.label")}
				>
					{LOCALES.map((item) => (
						<button
							key={item.value}
							type="button"
							role="option"
							aria-selected={locale === item.value}
							onClick={() => handleSelect(item.value)}
							className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors ${
								locale === item.value
									? "bg-[var(--bg-hover)] text-[var(--text-primary)]"
									: "text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
							}`}
						>
							<span>{item.label}</span>
						</button>
					))}
				</div>
			)}
		</div>
	);
}
