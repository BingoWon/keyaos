import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import {
	CheckIcon,
	ChevronDownIcon,
	XMarkIcon,
} from "@heroicons/react/20/solid";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Modality } from "../../worker/core/db/schema";
import type { ProviderMeta } from "../types/provider";
import type { ModelGroup } from "../utils/models";
import { getOrgName, getOrgSlug } from "../utils/orgMeta";
import { OrgLogo } from "./OrgLogo";
import { ProviderLogo } from "./ProviderLogo";

// ─── Types & helpers ─────────────────────────────────────

export interface ModelFiltersState {
	inputModalities: Set<Modality>;
	outputModalities: Set<Modality>;
	contextMin: number;
	orgs: Set<string>;
	providers: Set<string>;
}

export const EMPTY_FILTERS: ModelFiltersState = {
	inputModalities: new Set(),
	outputModalities: new Set(),
	contextMin: 0,
	orgs: new Set(),
	providers: new Set(),
};

export function isFiltersEmpty(f: ModelFiltersState): boolean {
	return (
		f.inputModalities.size === 0 &&
		f.outputModalities.size === 0 &&
		f.contextMin === 0 &&
		f.orgs.size === 0 &&
		f.providers.size === 0
	);
}

export function applyFilters(
	groups: ModelGroup[],
	f: ModelFiltersState,
): ModelGroup[] {
	return groups.filter((g) => {
		if (
			f.inputModalities.size > 0 &&
			!g.inputModalities.some((m) => f.inputModalities.has(m))
		)
			return false;
		if (
			f.outputModalities.size > 0 &&
			!g.outputModalities.some((m) => f.outputModalities.has(m))
		)
			return false;
		if (f.contextMin > 0) {
			const maxCtx = Math.max(...g.providers.map((p) => p.contextLength));
			if (maxCtx < f.contextMin) return false;
		}
		if (f.orgs.size > 0 && !f.orgs.has(getOrgSlug(g.id))) return false;
		if (
			f.providers.size > 0 &&
			!g.providers.some((p) => f.providers.has(p.provider_id))
		)
			return false;
		return true;
	});
}

// ─── Constants ───────────────────────────────────────────

const ALL_MODALITIES: Modality[] = ["text", "image", "file", "audio", "video"];

const CONTEXT_PRESETS: { value: number; label: string }[] = [
	{ value: 4_096, label: "4K+" },
	{ value: 16_384, label: "16K+" },
	{ value: 32_768, label: "32K+" },
	{ value: 65_536, label: "64K+" },
	{ value: 131_072, label: "128K+" },
	{ value: 262_144, label: "256K+" },
	{ value: 524_288, label: "512K+" },
	{ value: 1_048_576, label: "1M+" },
];

// ─── Main component ─────────────────────────────────────

interface Props {
	groups: ModelGroup[];
	providerMap: Map<string, ProviderMeta>;
	filters: ModelFiltersState;
	onChange: (f: ModelFiltersState) => void;
}

export function ModelFilters({
	groups,
	providerMap,
	filters,
	onChange,
}: Props) {
	const { t } = useTranslation();

	const orgOptions = useMemo(() => {
		const counts = new Map<string, number>();
		for (const g of groups) {
			const slug = getOrgSlug(g.id);
			counts.set(slug, (counts.get(slug) ?? 0) + 1);
		}
		return [...counts.entries()]
			.sort((a, b) => b[1] - a[1])
			.map(([slug, count]) => ({ id: slug, name: getOrgName(slug), count }));
	}, [groups]);

	const providerOptions = useMemo(() => {
		const counts = new Map<string, number>();
		for (const g of groups) {
			const seen = new Set<string>();
			for (const p of g.providers) {
				if (!seen.has(p.provider_id)) {
					seen.add(p.provider_id);
					counts.set(p.provider_id, (counts.get(p.provider_id) ?? 0) + 1);
				}
			}
		}
		return [...counts.entries()]
			.sort((a, b) => b[1] - a[1])
			.map(([id, count]) => ({
				id,
				name: providerMap.get(id)?.name ?? id,
				logoUrl: providerMap.get(id)?.logoUrl,
				count,
			}));
	}, [groups, providerMap]);

	const toggleModality = useCallback(
		(key: "inputModalities" | "outputModalities", m: Modality) => {
			const next = new Set(filters[key]);
			next.has(m) ? next.delete(m) : next.add(m);
			onChange({ ...filters, [key]: next });
		},
		[filters, onChange],
	);

	const toggleSet = useCallback(
		(key: "orgs" | "providers", val: string) => {
			const next = new Set(filters[key]);
			next.has(val) ? next.delete(val) : next.add(val);
			onChange({ ...filters, [key]: next });
		},
		[filters, onChange],
	);

	const setContextMin = useCallback(
		(v: number) =>
			onChange({ ...filters, contextMin: v === filters.contextMin ? 0 : v }),
		[filters, onChange],
	);

	const empty = isFiltersEmpty(filters);

	// Collect active tags for display
	const tags: { key: string; label: string; onRemove: () => void }[] = [];
	for (const m of filters.inputModalities) {
		tags.push({
			key: `in:${m}`,
			label: `In: ${m}`,
			onRemove: () => toggleModality("inputModalities", m),
		});
	}
	for (const m of filters.outputModalities) {
		tags.push({
			key: `out:${m}`,
			label: `Out: ${m}`,
			onRemove: () => toggleModality("outputModalities", m),
		});
	}
	if (filters.contextMin > 0) {
		const preset = CONTEXT_PRESETS.find((p) => p.value === filters.contextMin);
		tags.push({
			key: "ctx",
			label: `≥ ${preset?.label ?? `${filters.contextMin}`}`,
			onRemove: () => onChange({ ...filters, contextMin: 0 }),
		});
	}
	for (const slug of filters.orgs) {
		tags.push({
			key: `org:${slug}`,
			label: getOrgName(slug),
			onRemove: () => toggleSet("orgs", slug),
		});
	}
	for (const pid of filters.providers) {
		const name = providerMap.get(pid)?.name ?? pid;
		tags.push({
			key: `prov:${pid}`,
			label: name,
			onRemove: () => toggleSet("providers", pid),
		});
	}

	return (
		<div className="space-y-2.5">
			{/* Filter buttons row */}
			<div className="flex flex-wrap items-center gap-2">
				{/* Input Modalities */}
				<FilterPopover
					label={t("filters.input_modalities")}
					count={filters.inputModalities.size}
				>
					<div className="grid grid-cols-2 gap-1 p-2">
						{ALL_MODALITIES.map((m) => (
							<ToggleChip
								key={m}
								active={filters.inputModalities.has(m)}
								onClick={() => toggleModality("inputModalities", m)}
							>
								<span className="capitalize">{m}</span>
							</ToggleChip>
						))}
					</div>
				</FilterPopover>

				{/* Output Modalities */}
				<FilterPopover
					label={t("filters.output_modalities")}
					count={filters.outputModalities.size}
				>
					<div className="grid grid-cols-2 gap-1 p-2">
						{ALL_MODALITIES.map((m) => (
							<ToggleChip
								key={m}
								active={filters.outputModalities.has(m)}
								onClick={() => toggleModality("outputModalities", m)}
							>
								<span className="capitalize">{m}</span>
							</ToggleChip>
						))}
					</div>
				</FilterPopover>

				{/* Context Length */}
				<FilterPopover
					label={t("filters.context_length")}
					count={filters.contextMin > 0 ? 1 : 0}
				>
					<div className="grid grid-cols-2 gap-1 p-2">
						{CONTEXT_PRESETS.map((p) => (
							<ToggleChip
								key={p.value}
								active={filters.contextMin === p.value}
								onClick={() => setContextMin(p.value)}
							>
								{p.label}
							</ToggleChip>
						))}
					</div>
				</FilterPopover>

				{/* Organization */}
				<FilterPopover
					label={t("filters.organization")}
					count={filters.orgs.size}
					wide
				>
					<SearchableList
						items={orgOptions}
						selected={filters.orgs}
						onToggle={(id) => toggleSet("orgs", id)}
						renderIcon={(item) => <OrgLogo modelId={`${item.id}/`} size={16} />}
					/>
				</FilterPopover>

				{/* Provider */}
				<FilterPopover
					label={t("filters.provider")}
					count={filters.providers.size}
					wide
				>
					<SearchableList
						items={providerOptions}
						selected={filters.providers}
						onToggle={(id) => toggleSet("providers", id)}
						renderIcon={(item) =>
							item.logoUrl ? (
								<ProviderLogo src={item.logoUrl} name={item.name} size={16} />
							) : null
						}
					/>
				</FilterPopover>

				{/* Clear all */}
				{!empty && (
					<button
						type="button"
						onClick={() => onChange(EMPTY_FILTERS)}
						className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-gray-500 transition-colors hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
					>
						<XMarkIcon className="size-3.5" />
						{t("filters.clear_all")}
					</button>
				)}
			</div>

			{/* Active filter tags */}
			{tags.length > 0 && (
				<div className="flex flex-wrap items-center gap-1.5">
					{tags.map((tag) => (
						<span
							key={tag.key}
							className="inline-flex items-center gap-1 rounded-full bg-brand-50 py-0.5 pl-2.5 pr-1 text-xs font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"
						>
							{tag.label}
							<button
								type="button"
								onClick={tag.onRemove}
								className="rounded-full p-0.5 transition-colors hover:bg-brand-200/60 dark:hover:bg-brand-500/20"
							>
								<XMarkIcon className="size-3" />
							</button>
						</span>
					))}
				</div>
			)}
		</div>
	);
}

// ─── Filter popover trigger ──────────────────────────────

function FilterPopover({
	label,
	count,
	wide,
	children,
}: {
	label: string;
	count: number;
	wide?: boolean;
	children: React.ReactNode;
}) {
	return (
		<Popover className="relative">
			<PopoverButton className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-all hover:border-gray-300 hover:shadow focus:outline-none data-[open]:border-brand-400 data-[open]:ring-1 data-[open]:ring-brand-400/30 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:border-white/20 dark:data-[open]:border-brand-500 dark:data-[open]:ring-brand-500/20">
				{label}
				{count > 0 && (
					<span className="inline-flex size-4 items-center justify-center rounded-full bg-brand-600 text-[9px] font-bold text-white leading-none">
						{count}
					</span>
				)}
				<ChevronDownIcon className="size-3.5 text-gray-400 transition-transform ui-open:rotate-180" />
			</PopoverButton>

			<PopoverPanel
				anchor="bottom start"
				transition
				className={`z-50 mt-1.5 rounded-xl border border-gray-200 bg-white shadow-lg ring-1 ring-black/5 transition duration-150 ease-out data-[closed]:scale-95 data-[closed]:opacity-0 dark:border-white/10 dark:bg-gray-900 dark:ring-white/5 ${wide ? "w-64" : "w-52"}`}
			>
				{children}
			</PopoverPanel>
		</Popover>
	);
}

// ─── Toggle chip (modalities & context) ──────────────────

function ToggleChip({
	active,
	onClick,
	children,
}: {
	active: boolean;
	onClick: () => void;
	children: React.ReactNode;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
				active
					? "bg-brand-600 text-white shadow-sm dark:bg-brand-500"
					: "bg-gray-50 text-gray-600 hover:bg-gray-100 dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white/10"
			}`}
		>
			{active && <CheckIcon className="size-3" />}
			{children}
		</button>
	);
}

// ─── Searchable list (org & provider) ────────────────────

interface ListItem {
	id: string;
	name: string;
	count: number;
	[key: string]: unknown;
}

function SearchableList<T extends ListItem>({
	items,
	selected,
	onToggle,
	renderIcon,
}: {
	items: T[];
	selected: Set<string>;
	onToggle: (id: string) => void;
	renderIcon: (item: T) => React.ReactNode;
}) {
	const [search, setSearch] = useState("");
	const filtered = useMemo(() => {
		if (!search.trim()) return items;
		const q = search.toLowerCase();
		return items.filter(
			(i) => i.name.toLowerCase().includes(q) || i.id.toLowerCase().includes(q),
		);
	}, [items, search]);

	return (
		<div>
			{items.length > 6 && (
				<div className="border-b border-gray-100 px-2 pt-2 pb-1.5 dark:border-white/5">
					<input
						type="text"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Search…"
						className="w-full rounded-md border-0 bg-gray-50 px-2.5 py-1 text-xs text-gray-900 placeholder:text-gray-400 outline-none focus:ring-1 focus:ring-brand-400/40 dark:bg-white/5 dark:text-white dark:placeholder:text-gray-500"
					/>
				</div>
			)}
			<div className="max-h-56 overflow-y-auto overscroll-contain py-1">
				{filtered.length === 0 ? (
					<p className="px-3 py-2 text-xs text-gray-400 dark:text-gray-500">
						No match
					</p>
				) : (
					filtered.map((item) => {
						const active = selected.has(item.id);
						return (
							<button
								key={item.id}
								type="button"
								onClick={() => onToggle(item.id)}
								className={`flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs transition-colors ${
									active
										? "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"
										: "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
								}`}
							>
								<span
									className={`flex size-4 shrink-0 items-center justify-center rounded border transition-colors ${
										active
											? "border-brand-600 bg-brand-600 dark:border-brand-500 dark:bg-brand-500"
											: "border-gray-300 dark:border-white/20"
									}`}
								>
									{active && <CheckIcon className="size-3 text-white" />}
								</span>
								<span className="inline-flex min-w-0 flex-1 items-center gap-1.5 truncate">
									{renderIcon(item)}
									<span className="truncate">{item.name}</span>
								</span>
								<span className="tabular-nums text-[10px] text-gray-400 dark:text-gray-500">
									{item.count}
								</span>
							</button>
						);
					})
				)}
			</div>
		</div>
	);
}
