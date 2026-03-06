import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { classNames } from "../../utils/classNames";

interface TocItem {
	id: string;
	text: string;
	level: number;
}

const SCROLL_OFFSET = 80;

export function TableOfContents() {
	const { t } = useTranslation();
	const [items, setItems] = useState<TocItem[]>([]);
	const [activeId, setActiveId] = useState<string>("");
	const headingsRef = useRef<HTMLElement[]>([]);
	const rafRef = useRef(0);
	const { pathname } = useLocation();

	const syncActive = useCallback(() => {
		let current = "";
		for (const h of headingsRef.current) {
			if (h.getBoundingClientRect().top <= SCROLL_OFFSET) current = h.id;
		}
		setActiveId((prev) => {
			const next = current || headingsRef.current[0]?.id || "";
			return prev === next ? prev : next;
		});
	}, []);

	// biome-ignore lint/correctness/useExhaustiveDependencies: pathname triggers re-extraction on navigation
	useEffect(() => {
		const timer = setTimeout(() => {
			const headings = Array.from(
				document.querySelectorAll<HTMLElement>(
					"[data-docs-content] h2[id], [data-docs-content] h3[id]",
				),
			);
			headingsRef.current = headings;

			setItems(
				headings.map((h) => ({
					id: h.id,
					text: h.textContent ?? "",
					level: h.tagName === "H2" ? 2 : 3,
				})),
			);

			syncActive();

			const onScroll = () => {
				cancelAnimationFrame(rafRef.current);
				rafRef.current = requestAnimationFrame(syncActive);
			};
			window.addEventListener("scroll", onScroll, { passive: true });
			return () => window.removeEventListener("scroll", onScroll);
		}, 120);

		return () => clearTimeout(timer);
	}, [pathname, syncActive]);

	if (items.length === 0) return null;

	return (
		<nav className="border-l border-gray-200 pl-4 text-sm dark:border-white/10">
			<h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-900 dark:text-gray-200">
				{t("docs.on_this_page")}
			</h4>
			<ul className="space-y-1.5">
				{items.map((item) => (
					<li key={item.id}>
						<a
							href={`#${item.id}`}
							onClick={(e) => {
								e.preventDefault();
								document
									.getElementById(item.id)
									?.scrollIntoView({ behavior: "smooth" });
								window.history.replaceState(null, "", `#${item.id}`);
								setActiveId(item.id);
							}}
							className={classNames(
								item.level === 3 ? "pl-3" : "",
								activeId === item.id
									? "text-brand-600 dark:text-brand-400 font-medium"
									: "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white",
								"block truncate transition-colors text-[13px] leading-relaxed",
							)}
						>
							{item.text}
						</a>
					</li>
				))}
			</ul>
		</nav>
	);
}
