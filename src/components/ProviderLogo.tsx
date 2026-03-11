import { type ReactNode, useState } from "react";

// ─── Single logo ─────────────────────────────────────────

interface ProviderLogoProps {
	src: string;
	name: string;
	size?: number;
}

export function ProviderLogo({ src, name, size = 20 }: ProviderLogoProps) {
	const [failed, setFailed] = useState(false);

	if (failed) {
		return (
			<span
				className="inline-flex items-center justify-center rounded-sm bg-gray-200 dark:bg-gray-700 text-[10px] font-bold text-gray-500 dark:text-gray-400 shrink-0"
				style={{ width: size, height: size }}
			>
				{name.charAt(0).toUpperCase()}
			</span>
		);
	}

	return (
		<img
			src={src}
			alt={name}
			className="rounded-sm object-contain shrink-0"
			style={{ width: size, height: size }}
			onError={() => setFailed(true)}
		/>
	);
}

// ─── Logo group (table cells) ────────────────────────────

interface ProviderLogoGroupProps {
	providers: { provider_id: string }[];
	providerMap: ReadonlyMap<string, { logoUrl: string; name: string }>;
	max?: number;
	size?: number;
}

export function ProviderLogoGroup({
	providers,
	providerMap,
	max = 5,
	size = 16,
}: ProviderLogoGroupProps) {
	return (
		<span className="inline-flex items-center gap-1 rounded-md bg-white px-1.5 py-1 ring-1 ring-gray-950/[0.06] dark:bg-white/15 dark:ring-white/10">
			{providers.slice(0, max).map((p) => {
				const meta = providerMap.get(p.provider_id);
				return meta ? (
					<ProviderLogo
						key={p.provider_id}
						src={meta.logoUrl}
						name={meta.name}
						size={size}
					/>
				) : null;
			})}
			{providers.length > max && (
				<span className="text-[11px] text-gray-400 dark:text-gray-500">
					+{providers.length - max}
				</span>
			)}
		</span>
	);
}

// ─── Chip (logo + name card) ─────────────────────────────

interface ProviderChipProps {
	src: string;
	name: string;
	size?: number;
	badge?: ReactNode;
	onClick?: () => void;
	className?: string;
}

export function ProviderChip({
	src,
	name,
	size = 18,
	badge,
	onClick,
	className = "",
}: ProviderChipProps) {
	const base =
		"inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 border border-gray-200/80 dark:bg-white/15 dark:border-white/10 transition-colors";
	const interactive = onClick
		? "cursor-pointer hover:border-brand-300 dark:hover:border-brand-500/30"
		: "";

	const Tag = onClick ? "button" : "span";

	return (
		<Tag
			{...(onClick ? { type: "button" as const, onClick } : {})}
			className={`${base} ${interactive} ${className}`}
		>
			<ProviderLogo src={src} name={name} size={size} />
			<span className="text-sm font-medium text-gray-700 dark:text-gray-300">
				{name}
			</span>
			{badge}
		</Tag>
	);
}
