import { useTranslation } from "react-i18next";
import { TOKENS, type TokenName } from "../utils/colors";

export type HealthStatus = "ok" | "degraded" | "dead" | "cooldown";

const STATUS_TOKEN: Record<HealthStatus, TokenName> = {
	ok: "green",
	degraded: "yellow",
	cooldown: "blue",
	dead: "red",
};

export function HealthBadge({ status }: { status: HealthStatus }) {
	const { t } = useTranslation();

	return (
		<span
			className={`inline-flex items-center rounded-lg border px-2 py-1 text-xs font-medium ${TOKENS[STATUS_TOKEN[status]].outline}`}
		>
			{t(`credentials.status_${status}`)}
		</span>
	);
}
