import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import { useState } from "react";
import { useTranslation } from "react-i18next";

function pageRange(current: number, total: number): (number | "...")[] {
	if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

	const pages: (number | "...")[] = [1, 2];
	const left = Math.max(3, current - 1);
	const right = Math.min(total - 1, current + 1);

	if (left > 3) pages.push("...");
	for (let i = left; i <= right; i++) pages.push(i);
	if (right < total - 1) pages.push("...");
	if (total > 2) pages.push(total);

	return pages;
}

const PAGE_SIZE_OPTIONS = [20, 30, 50, 100];

export function Pagination({
	page,
	totalPages,
	onChange,
	pageSize,
	onPageSizeChange,
}: {
	page: number;
	totalPages: number;
	onChange: (p: number) => void;
	pageSize?: number;
	onPageSizeChange?: (size: number) => void;
}) {
	const { t } = useTranslation();
	const [jumpInput, setJumpInput] = useState("");

	if (totalPages <= 1 && !onPageSizeChange) return null;

	const btnBase =
		"inline-flex items-center justify-center size-8 rounded-md text-xs font-medium transition-colors";
	const btnIdle =
		"text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10";
	const btnActive = "bg-brand-500 text-white";
	const btnDisabled = "opacity-30 pointer-events-none";

	const handleJump = () => {
		const n = Number.parseInt(jumpInput, 10);
		if (n >= 1 && n <= totalPages) {
			onChange(n);
			setJumpInput("");
		}
	};

	return (
		<nav className="flex flex-wrap items-center gap-2">
			{onPageSizeChange && pageSize && (
				<select
					value={pageSize}
					onChange={(e) => onPageSizeChange(Number(e.target.value))}
					className="h-8 rounded-md border border-gray-200 bg-white px-2 text-xs text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/20"
				>
					{PAGE_SIZE_OPTIONS.map((s) => (
						<option key={s} value={s}>
							{t("pagination.per_page", { size: s })}
						</option>
					))}
				</select>
			)}

			{totalPages > 1 && (
				<>
					<button
						type="button"
						disabled={page <= 1}
						onClick={() => onChange(page - 1)}
						className={`${btnBase} ${page <= 1 ? btnDisabled : btnIdle}`}
					>
						<ChevronLeftIcon className="size-4" />
					</button>
					{pageRange(page, totalPages).map((p, idx) =>
						p === "..." ? (
							<span
								key={`dots-${idx < 4 ? "start" : "end"}`}
								className="inline-flex items-center justify-center size-8 text-xs text-gray-400"
							>
								…
							</span>
						) : (
							<button
								key={p}
								type="button"
								onClick={() => onChange(p)}
								className={`${btnBase} ${p === page ? btnActive : btnIdle}`}
							>
								{p}
							</button>
						),
					)}
					<button
						type="button"
						disabled={page >= totalPages}
						onClick={() => onChange(page + 1)}
						className={`${btnBase} ${page >= totalPages ? btnDisabled : btnIdle}`}
					>
						<ChevronRightIcon className="size-4" />
					</button>
				</>
			)}

			{totalPages > 1 && (
				<span className="inline-flex items-center gap-1 ml-1">
					<input
						type="text"
						inputMode="numeric"
						value={jumpInput}
						onChange={(e) => setJumpInput(e.target.value.replace(/\D/g, ""))}
						onKeyDown={(e) => e.key === "Enter" && handleJump()}
						placeholder={String(page)}
						className="h-8 w-12 rounded-md border border-gray-200 bg-white px-2 text-center text-xs tabular-nums text-gray-700 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/20"
					/>
					<button
						type="button"
						onClick={handleJump}
						className="h-8 rounded-md border border-gray-200 bg-white px-2 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white/10"
					>
						{t("pagination.go")}
					</button>
				</span>
			)}
		</nav>
	);
}
