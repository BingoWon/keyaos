import {
	DocumentArrowUpIcon,
	MicrophoneIcon,
	PhotoIcon,
	VideoCameraIcon,
} from "@heroicons/react/20/solid";
import { Icon } from "@iconify/react";
import type { Modality } from "../../worker/core/db/schema";

/** Canonical display order — single source of truth. */
export const MODALITY_ORDER: Modality[] = [
	"text",
	"image",
	"file",
	"audio",
	"video",
	"embeddings",
];

/** Modality → icon component — single source of truth. */
export const MODALITY_ICON: Record<
	Modality,
	React.FC<{ className?: string }>
> = {
	text: ({ className }) => (
		<Icon icon="solar:text-square-bold" className={className} />
	),
	image: PhotoIcon,
	file: DocumentArrowUpIcon,
	audio: MicrophoneIcon,
	video: VideoCameraIcon,
	embeddings: ({ className }) => (
		<Icon icon="solar:three-squares-bold" className={className} />
	),
};

function ModalityDot({ modality, size }: { modality: Modality; size: number }) {
	const IconComp = MODALITY_ICON[modality];
	return (
		<span className="group/tip relative inline-flex">
			<span className="shrink-0" style={{ width: size, height: size }}>
				<IconComp className="size-full" />
			</span>
			<span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-1.5 py-0.5 text-[10px] font-medium text-white opacity-0 transition-opacity group-hover/tip:opacity-100 dark:bg-gray-700">
				{modality}
			</span>
		</span>
	);
}

function renderRow(modalities: Modality[], size: number) {
	return MODALITY_ORDER.filter((m) => modalities.includes(m)).map((m) => (
		<ModalityDot key={m} modality={m} size={size} />
	));
}

// ─── Inline badges (for Models page / Dashboard cards) ──

/** Compact Input→Output badge pair. */
export function ModalityBadges({
	input,
	output,
	size = 16,
}: {
	input?: Modality[];
	output?: Modality[];
	size?: number;
}) {
	const inp = input ?? ["text"];
	const out = output ?? ["text"];

	return (
		<span className="inline-flex items-center gap-1.5 text-gray-400 dark:text-gray-500">
			<span className="inline-flex items-center gap-0.5">
				{renderRow(inp, size)}
			</span>
			<span className="text-[10px] text-gray-300 dark:text-gray-600 select-none">
				→
			</span>
			<span className="inline-flex items-center gap-0.5">
				{renderRow(out, size)}
			</span>
		</span>
	);
}

// ─── Table cell (for Providers page columns) ────────────

/** Render a single modality cell for table columns. Shows sorted icons. */
export function ModalityCell({
	modalities,
	size = 16,
}: {
	modalities?: Modality[];
	size?: number;
}) {
	const mods = modalities ?? ["text"];
	return (
		<span className="inline-flex items-center gap-0.5 text-gray-400 dark:text-gray-500">
			{renderRow(mods, size)}
		</span>
	);
}
