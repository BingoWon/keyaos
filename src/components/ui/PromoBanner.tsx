import { XMarkIcon } from "@heroicons/react/20/solid";
import { type ReactNode, useCallback, useEffect, useState } from "react";

const STORAGE_PREFIX = "banner_dismissed_";

interface PromoBannerProps {
	id: string;
	title: ReactNode;
	description: ReactNode;
}

export function PromoBanner({ id, title, description }: PromoBannerProps) {
	const key = `${STORAGE_PREFIX}${id}`;
	const [visible, setVisible] = useState(false);
	const [leaving, setLeaving] = useState(false);

	useEffect(() => {
		try {
			if (!localStorage.getItem(key)) setVisible(true);
		} catch {
			setVisible(true);
		}
	}, [key]);

	const dismiss = useCallback(() => {
		setLeaving(true);
		try {
			localStorage.setItem(key, "1");
		} catch {}
		setTimeout(() => setVisible(false), 300);
	}, [key]);

	if (!visible) return null;

	return (
		<div
			className={`relative mt-4 overflow-hidden rounded-xl px-4 py-3 transition-all duration-300 ring-1 ring-white/15 shadow-sm dark:ring-white/[0.08] dark:shadow-lg dark:shadow-black/30 ${
				leaving ? "opacity-0 scale-[0.98]" : "opacity-100"
			}`}
		>
			{/* Light: Brand Gradient */}
			<div className="absolute inset-0 bg-gradient-to-br from-brand-600 via-brand-500 to-accent-400 dark:hidden" />
			{/* Dark: Surface Gradient */}
			<div
				className="absolute inset-0 hidden dark:block"
				style={{
					background: [
						"radial-gradient(circle at 25% 20%, rgba(127,57,173,0.28), transparent 55%)",
						"radial-gradient(circle at 80% 75%, rgba(208,144,96,0.20), transparent 55%)",
						"linear-gradient(180deg, rgba(30,10,56,0.95), rgba(20,6,38,0.88))",
					].join(", "),
				}}
			/>
			<div className="relative flex items-start gap-3">
				<div className="min-w-0 flex-1">
					<h2 className="text-[15px] font-semibold text-white">{title}</h2>
					<p className="mt-1 text-[13px] leading-relaxed text-white/80">
						{description}
					</p>
				</div>
				<button
					type="button"
					onClick={dismiss}
					className="shrink-0 rounded-md p-1 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
				>
					<XMarkIcon className="size-4" />
				</button>
			</div>
		</div>
	);
}
