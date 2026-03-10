import {
	CheckIcon,
	ChevronUpDownIcon,
	MagnifyingGlassIcon,
	XMarkIcon,
} from "@heroicons/react/20/solid";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useFetch } from "../hooks/useFetch";
import type { ModelEntry } from "../types/model";
import { aggregateModels } from "../utils/models";

interface Props {
	value: string[];
	onChange: (models: string[]) => void;
	placeholder?: string;
}

export function ModelMultiSelect({ value, onChange, placeholder }: Props) {
	const { t } = useTranslation();
	const { data: models } = useFetch<ModelEntry[]>("/api/models", {
		requireAuth: false,
	});
	const groups = useMemo(
		() => (models ? aggregateModels(models) : []),
		[models],
	);
	const allIds = useMemo(() => groups.map((g) => g.id), [groups]);

	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState("");
	const containerRef = useRef<HTMLDivElement>(null);
	const searchRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (open) searchRef.current?.focus();
	}, [open]);

	useEffect(() => {
		const handler = (e: MouseEvent) => {
			if (
				containerRef.current &&
				!containerRef.current.contains(e.target as Node)
			) {
				setOpen(false);
			}
		};
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, []);

	const filtered = useMemo(() => {
		if (!search) return allIds;
		const q = search.toLowerCase();
		return allIds.filter((id) => id.toLowerCase().includes(q));
	}, [allIds, search]);

	const selected = useMemo(() => new Set(value), [value]);

	const toggle = (id: string) => {
		if (selected.has(id)) {
			onChange(value.filter((v) => v !== id));
		} else {
			onChange([...value, id]);
		}
	};

	const remove = (id: string) => onChange(value.filter((v) => v !== id));

	return (
		<div ref={containerRef} className="relative">
			{/* Trigger */}
			<button
				type="button"
				onClick={() => setOpen(!open)}
				className="flex w-full items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-left text-sm transition-colors hover:border-gray-300 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20 dark:focus:border-brand-400"
			>
				<span className="flex-1 truncate text-gray-500 dark:text-gray-400">
					{value.length === 0
						? (placeholder ?? t("api_keys.allowed_models_all"))
						: t("api_keys.models_selected", { count: value.length })}
				</span>
				<ChevronUpDownIcon className="size-4 shrink-0 text-gray-400" />
			</button>

			{/* Selected chips */}
			{value.length > 0 && (
				<div className="mt-1.5 flex flex-wrap gap-1">
					{value.map((id) => (
						<span
							key={id}
							className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-500/15 dark:text-brand-300"
						>
							{id}
							<button
								type="button"
								onClick={() => remove(id)}
								className="ml-0.5 rounded hover:bg-brand-100 dark:hover:bg-brand-500/25"
							>
								<XMarkIcon className="size-3" />
							</button>
						</span>
					))}
				</div>
			)}

			{/* Dropdown */}
			{open && (
				<div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-white/10 dark:bg-gray-900">
					{/* Search */}
					<div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2 dark:border-white/5">
						<MagnifyingGlassIcon className="size-4 shrink-0 text-gray-400" />
						<input
							ref={searchRef}
							type="text"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder={t("api_keys.search_models")}
							className="w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none dark:text-white dark:placeholder:text-gray-500"
						/>
						{value.length > 0 && (
							<button
								type="button"
								onClick={() => onChange([])}
								className="shrink-0 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
							>
								{t("api_keys.clear_selection")}
							</button>
						)}
					</div>

					{/* List */}
					<div className="max-h-52 overflow-y-auto overscroll-contain py-1">
						{filtered.length === 0 ? (
							<div className="px-3 py-4 text-center text-xs text-gray-400">
								{t("api_keys.no_models_found")}
							</div>
						) : (
							filtered.map((id) => {
								const isSelected = selected.has(id);
								return (
									<button
										key={id}
										type="button"
										onClick={() => toggle(id)}
										className={`flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-sm transition-colors ${
											isSelected
												? "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"
												: "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
										}`}
									>
										<span
											className={`flex size-4 shrink-0 items-center justify-center rounded border ${
												isSelected
													? "border-brand-500 bg-brand-500 dark:border-brand-400 dark:bg-brand-500"
													: "border-gray-300 dark:border-white/20"
											}`}
										>
											{isSelected && (
												<CheckIcon className="size-3 text-white" />
											)}
										</span>
										<span className="truncate">{id}</span>
									</button>
								);
							})
						)}
					</div>
				</div>
			)}
		</div>
	);
}
