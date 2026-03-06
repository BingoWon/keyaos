import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import {
	CheckIcon,
	ChevronDownIcon,
	DocumentArrowUpIcon,
	MicrophoneIcon,
	PhotoIcon,
	VideoCameraIcon,
	XMarkIcon,
} from "@heroicons/react/20/solid";
import { Icon } from "@iconify/react";
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

// ─── Modality theme ──────────────────────────────────────

const MODALITY_THEME: Record<
	Modality,
	{
		icon: React.FC<{ className?: string }>;
		active: string;
		inactive: string;
		tag: string;
	}
> = {
	text: {
		icon: ({ className }) => (
			<Icon icon="solar:text-square-bold" className={className} />
		),
		active:
			"bg-blue-600 text-white shadow-sm dark:bg-blue-500 ring-blue-600/20",
		inactive:
			"bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-300 dark:hover:bg-blue-500/20",
		tag: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
	},
	image: {
		icon: PhotoIcon,
		active:
			"bg-emerald-600 text-white shadow-sm dark:bg-emerald-500 ring-emerald-600/20",
		inactive:
			"bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20",
		tag: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
	},
	file: {
		icon: DocumentArrowUpIcon,
		active:
			"bg-amber-600 text-white shadow-sm dark:bg-amber-500 ring-amber-600/20",
		inactive:
			"bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/20",
		tag: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
	},
	audio: {
		icon: MicrophoneIcon,
		active:
			"bg-violet-600 text-white shadow-sm dark:bg-violet-500 ring-violet-600/20",
		inactive:
			"bg-violet-50 text-violet-700 hover:bg-violet-100 dark:bg-violet-500/10 dark:text-violet-300 dark:hover:bg-violet-500/20",
		tag: "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300",
	},
	video: {
		icon: VideoCameraIcon,
		active:
			"bg-rose-600 text-white shadow-sm dark:bg-rose-500 ring-rose-600/20",
		inactive:
			"bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/20",
		tag: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
	},
};

const ALL_MODALITIES: Modality[] = ["text", "image", "file", "audio", "video"];

// ─── Context ─────────────────────────────────────────────

const CONTEXT_STEPS = [
	{ value: 0, label: "Any" },
	{ value: 4_096, label: "4K" },
	{ value: 16_384, label: "16K" },
	{ value: 32_768, label: "32K" },
	{ value: 65_536, label: "64K" },
	{ value: 131_072, label: "128K" },
	{ value: 262_144, label: "256K" },
	{ value: 524_288, label: "512K" },
	{ value: 1_048_576, label: "1M" },
	{ value: 2_097_152, label: "2M" },
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
		(v: number) => onChange({ ...filters, contextMin: v }),
		[filters, onChange],
	);

	const empty = isFiltersEmpty(filters);

	const contextIdx = CONTEXT_STEPS.findIndex(
		(s) => s.value === filters.contextMin,
	);
	const contextLabel = CONTEXT_STEPS[contextIdx >= 0 ? contextIdx : 0].label;

	// ─── Active tags ─────────────────────────────────────
	const tags: {
		key: string;
		label: string;
		color: string;
		onRemove: () => void;
	}[] = [];
	for (const m of filters.inputModalities) {
		tags.push({
			key: `in:${m}`,
			label: `In: ${m}`,
			color: MODALITY_THEME[m].tag,
			onRemove: () => toggleModality("inputModalities", m),
		});
	}
	for (const m of filters.outputModalities) {
		tags.push({
			key: `out:${m}`,
			label: `Out: ${m}`,
			color: MODALITY_THEME[m].tag,
			onRemove: () => toggleModality("outputModalities", m),
		});
	}
	if (filters.contextMin > 0) {
		const preset = CONTEXT_STEPS.find((p) => p.value === filters.contextMin);
		tags.push({
			key: "ctx",
			label: `Context ≥ ${preset?.label ?? "?"}`,
			color: "bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300",
			onRemove: () => onChange({ ...filters, contextMin: 0 }),
		});
	}
	for (const slug of filters.orgs) {
		tags.push({
			key: `org:${slug}`,
			label: getOrgName(slug),
			color:
				"bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300",
			onRemove: () => toggleSet("orgs", slug),
		});
	}
	for (const pid of filters.providers) {
		const name = providerMap.get(pid)?.name ?? pid;
		tags.push({
			key: `prov:${pid}`,
			label: name,
			color: "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-300",
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
					<div className="flex flex-col gap-1 p-2">
						{ALL_MODALITIES.map((m) => {
							const theme = MODALITY_THEME[m];
							const active = filters.inputModalities.has(m);
							return (
								<ModalityChip
									key={m}
									modality={m}
									icon={theme.icon}
									active={active}
									activeClass={theme.active}
									inactiveClass={theme.inactive}
									onClick={() => toggleModality("inputModalities", m)}
								/>
							);
						})}
					</div>
				</FilterPopover>

				{/* Output Modalities */}
				<FilterPopover
					label={t("filters.output_modalities")}
					count={filters.outputModalities.size}
				>
					<div className="flex flex-col gap-1 p-2">
						{ALL_MODALITIES.map((m) => {
							const theme = MODALITY_THEME[m];
							const active = filters.outputModalities.has(m);
							return (
								<ModalityChip
									key={m}
									modality={m}
									icon={theme.icon}
									active={active}
									activeClass={theme.active}
									inactiveClass={theme.inactive}
									onClick={() => toggleModality("outputModalities", m)}
								/>
							);
						})}
					</div>
				</FilterPopover>

				{/* Context Length — slider */}
				<FilterPopover
					label={
						filters.contextMin > 0
							? `${t("filters.context_length")} ≥ ${contextLabel}`
							: t("filters.context_length")
					}
					count={filters.contextMin > 0 ? 1 : 0}
					width="w-72"
				>
					<div className="px-4 pt-3 pb-4">
						<div className="mb-3 text-center">
							<span className="inline-block rounded-full bg-cyan-50 px-3 py-1 text-sm font-semibold tabular-nums text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300">
								≥ {contextLabel}
							</span>
						</div>
						<input
							type="range"
							min={0}
							max={CONTEXT_STEPS.length - 1}
							step={1}
							value={contextIdx >= 0 ? contextIdx : 0}
							onChange={(e) =>
								setContextMin(CONTEXT_STEPS[Number(e.target.value)].value)
							}
							className="context-slider w-full"
						/>
						<div className="mt-1.5 flex justify-between text-[10px] font-medium text-gray-400 dark:text-gray-500">
							<span>Any</span>
							<span>4K</span>
							<span>32K</span>
							<span>128K</span>
							<span>1M</span>
							<span>2M</span>
						</div>
					</div>
				</FilterPopover>

				{/* Organization */}
				<FilterPopover
					label={t("filters.organization")}
					count={filters.orgs.size}
					width="w-64"
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
					width="w-64"
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
							className={`inline-flex items-center gap-1 rounded-full py-0.5 pl-2.5 pr-1 text-xs font-medium ${tag.color}`}
						>
							{tag.label}
							<button
								type="button"
								onClick={tag.onRemove}
								className="rounded-full p-0.5 opacity-60 transition-opacity hover:opacity-100"
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

// ─── Filter popover ──────────────────────────────────────

function FilterPopover({
	label,
	count,
	width = "w-52",
	children,
}: {
	label: string;
	count: number;
	width?: string;
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
				<ChevronDownIcon className="size-3.5 text-gray-400" />
			</PopoverButton>

			<PopoverPanel
				anchor="bottom start"
				transition
				className={`z-50 mt-1.5 rounded-xl border border-gray-200 bg-white shadow-lg ring-1 ring-black/5 transition duration-150 ease-out data-[closed]:scale-95 data-[closed]:opacity-0 dark:border-white/10 dark:bg-gray-900 dark:ring-white/5 ${width}`}
			>
				{children}
			</PopoverPanel>
		</Popover>
	);
}

// ─── Modality chip with icon + color ─────────────────────

function ModalityChip({
	modality,
	icon: IconComp,
	active,
	activeClass,
	inactiveClass,
	onClick,
}: {
	modality: Modality;
	icon: React.FC<{ className?: string }>;
	active: boolean;
	activeClass: string;
	inactiveClass: string;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all ${active ? activeClass : inactiveClass}`}
		>
			<IconComp className="size-4" />
			<span className="flex-1 text-left capitalize">{modality}</span>
			{active && <CheckIcon className="size-3.5" />}
		</button>
	);
}

// ─── Searchable list ─────────────────────────────────────

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
