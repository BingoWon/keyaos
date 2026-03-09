import { CreditCard, Key, SignIn } from "@phosphor-icons/react";
import { Button } from "@wolf/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@wolf/components/ui/dialog";
import type { GateReason } from "@wolf/hooks/useGameGate";
import { useTranslations } from "next-intl";
import { useNavigate } from "react-router-dom";

interface GateModalProps {
	reason: GateReason;
	onClose: () => void;
	/** Only shown when reason is "resources" during an active game. */
	onAbandon?: () => void;
}

export function GateModal({ reason, onClose, onAbandon }: GateModalProps) {
	const t = useTranslations("gateModal");
	const navigate = useNavigate();

	if (!reason) return null;

	const isAuth = reason === "auth";

	return (
		<Dialog open onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle className="text-[var(--text-primary)]">
						{isAuth ? t("auth.title") : t("resources.title")}
					</DialogTitle>
					<DialogDescription className="text-[var(--text-secondary)]">
						{isAuth ? t("auth.description") : t("resources.description")}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-3 pt-2">
					{isAuth ? (
						<Button
							type="button"
							onClick={() => {
								onClose();
								navigate("/login?redirect=/werewolf");
							}}
							className="w-full h-11 gap-2 bg-[var(--color-gold)] text-[var(--bg-primary)] hover:brightness-110 font-medium shadow-lg shadow-[var(--color-gold)]/20"
						>
							<SignIn size={18} weight="bold" />
							{t("auth.action")}
						</Button>
					) : (
						<>
							<Button
								type="button"
								onClick={() => {
									onClose();
									navigate("/dashboard/credits");
								}}
								className="w-full h-11 gap-2 bg-[var(--color-gold)] text-[var(--bg-primary)] hover:brightness-110 font-medium shadow-lg shadow-[var(--color-gold)]/20"
							>
								<CreditCard size={18} weight="bold" />
								{t("resources.topUp")}
							</Button>
							<Button
								type="button"
								variant="outline"
								onClick={() => {
									onClose();
									navigate("/dashboard/byok");
								}}
								className="w-full h-11 gap-2 font-medium"
							>
								<Key size={18} />
								{t("resources.addKey")}
							</Button>
						</>
					)}

					{onAbandon && !isAuth && (
						<button
							type="button"
							onClick={() => {
								onClose();
								onAbandon();
							}}
							className="w-full py-2 text-sm text-[var(--text-muted)] hover:text-[var(--color-gold)] transition-colors"
						>
							{t("resources.abandon")}
						</button>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
