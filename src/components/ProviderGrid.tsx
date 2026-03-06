import { useNavigate } from "react-router-dom";
import type { ProviderGroup } from "../utils/providers";
import { ProviderChip } from "./ProviderLogo";
import { Badge } from "./ui";

interface ProviderGridProps {
	groups: ProviderGroup[];
	center?: boolean;
}

export function ProviderGrid({ groups, center }: ProviderGridProps) {
	const navigate = useNavigate();

	return (
		<div className={`flex flex-wrap gap-2.5 ${center ? "justify-center" : ""}`}>
			{groups.map((g) => (
				<ProviderChip
					key={g.provider.id}
					src={g.provider.logoUrl}
					name={g.provider.name}
					badge={<Badge variant="brand">{g.models.length}</Badge>}
					onClick={() => navigate(`/providers/${g.provider.id}`)}
				/>
			))}
		</div>
	);
}
