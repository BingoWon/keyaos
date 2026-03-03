import { lazy, Suspense, useState } from "react";
import type { ProviderGroup } from "../utils/providers";
import { ProviderChip } from "./ProviderLogo";
import { Badge } from "./ui";

const ProviderDetailModal = lazy(() =>
	import("./ProviderDetailModal").then((m) => ({
		default: m.ProviderDetailModal,
	})),
);

interface ProviderGridProps {
	groups: ProviderGroup[];
	center?: boolean;
}

export function ProviderGrid({ groups, center }: ProviderGridProps) {
	const [selected, setSelected] = useState<ProviderGroup | null>(null);

	return (
		<>
			<div
				className={`flex flex-wrap gap-2.5 ${center ? "justify-center" : ""}`}
			>
				{groups.map((g) => (
					<ProviderChip
						key={g.provider.id}
						src={g.provider.logoUrl}
						name={g.provider.name}
						badge={<Badge variant="brand">{g.models.length}</Badge>}
						onClick={() => setSelected(g)}
					/>
				))}
			</div>
			{selected && (
				<Suspense fallback={null}>
					<ProviderDetailModal
						group={selected}
						onClose={() => setSelected(null)}
					/>
				</Suspense>
			)}
		</>
	);
}
