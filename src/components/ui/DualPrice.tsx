import { useTranslation } from "react-i18next";
import { formatPrice } from "../../utils/format";

interface DualPriceProps {
	original: number;
	platform?: number;
}

export function DualPrice({ original, platform }: DualPriceProps) {
	const { t } = useTranslation();
	const free = t("common.free");

	if (platform != null && platform < original) {
		return (
			<>
				{formatPrice(platform, free)}{" "}
				<span className="text-[0.85em] line-through opacity-35">
					{formatPrice(original, free)}
				</span>
			</>
		);
	}
	return <>{formatPrice(original, free)}</>;
}
