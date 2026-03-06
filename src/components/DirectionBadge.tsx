import {
	ArrowDownTrayIcon,
	ArrowPathIcon,
	ArrowUpTrayIcon,
} from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import { TOKENS } from "../utils/colors";

export function DirectionBadge({
	direction,
}: {
	direction: "spent" | "earned" | "self";
}) {
	const { t } = useTranslation();

	if (direction === "earned") {
		return (
			<span
				className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${TOKENS.green.soft}`}
			>
				<ArrowDownTrayIcon className="size-3" />
				{t("logs.earned")}
			</span>
		);
	}
	if (direction === "spent") {
		return (
			<span
				className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${TOKENS.red.soft}`}
			>
				<ArrowUpTrayIcon className="size-3" />
				{t("logs.spent")}
			</span>
		);
	}
	return (
		<span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-500 dark:bg-white/5 dark:text-gray-400">
			<ArrowPathIcon className="size-3" />
			{t("logs.self_use")}
		</span>
	);
}
