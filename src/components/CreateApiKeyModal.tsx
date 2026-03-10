import { CheckIcon, ClipboardDocumentIcon } from "@heroicons/react/20/solid";
import type React from "react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useAuth } from "../auth";
import { TOKENS } from "../utils/colors";
import { Modal } from "./Modal";
import { Button, Input } from "./ui";

interface CreatedKey {
	id: string;
	name: string;
	plainKey: string;
}

interface CreateApiKeyModalProps {
	open: boolean;
	onClose: () => void;
	onCreated?: (key: CreatedKey) => void;
}

type ExpiryPreset = "never" | "7d" | "30d" | "90d" | "custom";

function expiryToTimestamp(
	preset: ExpiryPreset,
	customDate: string,
): number | null {
	if (preset === "never") return null;
	if (preset === "custom" && customDate)
		return new Date(customDate).getTime();
	const days = { "7d": 7, "30d": 30, "90d": 90 }[preset];
	if (days) return Date.now() + days * 86_400_000;
	return null;
}

export function CreateApiKeyModal({
	open,
	onClose,
	onCreated,
}: CreateApiKeyModalProps) {
	const { t } = useTranslation();
	const { getToken } = useAuth();
	const [name, setName] = useState("");
	const [createdKey, setCreatedKey] = useState<string | null>(null);
	const [copied, setCopied] = useState(false);

	const [expiryPreset, setExpiryPreset] = useState<ExpiryPreset>("never");
	const [customDate, setCustomDate] = useState("");
	const [quotaEnabled, setQuotaEnabled] = useState(false);
	const [quotaLimit, setQuotaLimit] = useState("");
	const [modelsText, setModelsText] = useState("");
	const [ipsText, setIpsText] = useState("");

	const handleClose = () => {
		onClose();
		setTimeout(() => {
			setCreatedKey(null);
			setName("");
			setCopied(false);
			setExpiryPreset("never");
			setCustomDate("");
			setQuotaEnabled(false);
			setQuotaLimit("");
			setModelsText("");
			setIpsText("");
		}, 200);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const tid = toast.loading(t("common.loading"));

		const allowedModels = modelsText
			.split(/[,\n]/)
			.map((s) => s.trim())
			.filter(Boolean);
		const allowedIps = ipsText
			.split(/[,\n]/)
			.map((s) => s.trim())
			.filter(Boolean);

		try {
			const res = await fetch("/api/api-keys", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${await getToken()}`,
				},
				body: JSON.stringify({
					name,
					expiresAt: expiryToTimestamp(expiryPreset, customDate),
					quotaLimit: quotaEnabled && quotaLimit ? Number(quotaLimit) : null,
					allowedModels: allowedModels.length ? allowedModels : null,
					allowedIps: allowedIps.length ? allowedIps : null,
				}),
			});
			const result = await res.json();
			if (res.ok) {
				setCreatedKey(result.data.plainKey);
				setCopied(false);
				setName("");
				onCreated?.({
					id: result.data.id,
					name: result.data.name,
					plainKey: result.data.plainKey,
				});
				toast.success(t("common.success"), { id: tid });
			} else {
				toast.error(result.error?.message || res.statusText, { id: tid });
			}
		} catch (err) {
			console.error(err);
			toast.error(t("common.error"), { id: tid });
		}
	};

	const labelCls =
		"block text-sm font-medium text-gray-700 dark:text-gray-300";
	const hintCls = "mt-0.5 text-xs text-gray-400 dark:text-gray-500";

	return (
		<Modal
			open={open}
			onClose={handleClose}
			title={createdKey ? t("api_keys.key") : t("api_keys.create")}
			size="md"
		>
			{createdKey ? (
				<div className="space-y-4">
					<div
						className={`rounded-xl border p-3 text-xs ${TOKENS.amber.outline}`}
					>
						⚠️ {t("api_keys.copy_warning")}
					</div>
					<div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3 font-mono text-sm text-gray-800 dark:border-white/10 dark:bg-white/5 dark:text-gray-200">
						<span className="flex-1 break-all select-all">{createdKey}</span>
						<button
							type="button"
							onClick={() => {
								navigator.clipboard.writeText(createdKey);
								setCopied(true);
								toast.success(t("api_keys.copied"));
							}}
							className="shrink-0 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brand-600"
						>
							{copied ? (
								<span className="flex items-center gap-1">
									<CheckIcon className="size-3.5" />
									{t("api_keys.copied")}
								</span>
							) : (
								<span className="flex items-center gap-1">
									<ClipboardDocumentIcon className="size-3.5" />
									{t("common.copy")}
								</span>
							)}
						</button>
					</div>
					<div className="flex justify-end">
						<Button onClick={handleClose}>{t("common.confirm")}</Button>
					</div>
				</div>
			) : (
				<form onSubmit={handleSubmit} className="space-y-5">
					{/* Name */}
					<div>
						<label htmlFor="modal-key-name" className={labelCls}>
							{t("api_keys.name")}
						</label>
						<Input
							type="text"
							id="modal-key-name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							className="mt-1"
							placeholder="e.g. Production"
							autoFocus
						/>
					</div>

					{/* Expiration */}
					<div>
						<label className={labelCls}>{t("api_keys.expires_at")}</label>
						<div className="mt-1 flex flex-wrap gap-2">
							{(
								[
									["never", t("api_keys.expires_never")],
									["7d", "7 days"],
									["30d", "30 days"],
									["90d", "90 days"],
									["custom", "Custom"],
								] as const
							).map(([val, label]) => (
								<button
									key={val}
									type="button"
									onClick={() => setExpiryPreset(val as ExpiryPreset)}
									className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
										expiryPreset === val
											? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400"
											: "border-gray-200 text-gray-600 hover:border-gray-300 dark:border-white/10 dark:text-gray-400 dark:hover:border-white/20"
									}`}
								>
									{label}
								</button>
							))}
						</div>
						{expiryPreset === "custom" && (
							<Input
								type="datetime-local"
								value={customDate}
								onChange={(e) => setCustomDate(e.target.value)}
								className="mt-2"
								min={new Date().toISOString().slice(0, 16)}
							/>
						)}
					</div>

					{/* Quota */}
					<div>
						<label className={labelCls}>{t("api_keys.quota")}</label>
						<div className="mt-1 flex items-center gap-3">
							<label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
								<input
									type="checkbox"
									checked={quotaEnabled}
									onChange={(e) => setQuotaEnabled(e.target.checked)}
									className="rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-white/20 dark:bg-white/5"
								/>
								Enable quota limit
							</label>
							{quotaEnabled && (
								<Input
									type="number"
									value={quotaLimit}
									onChange={(e) => setQuotaLimit(e.target.value)}
									className="w-32"
									placeholder="e.g. 10.00"
									step="0.01"
									min="0.01"
								/>
							)}
						</div>
						{quotaEnabled && (
							<p className={hintCls}>
								Maximum spending in credits (USD). Key will stop working once
								exceeded.
							</p>
						)}
					</div>

					{/* Allowed Models */}
					<div>
						<label htmlFor="modal-key-models" className={labelCls}>
							{t("api_keys.allowed_models")}
						</label>
						<textarea
							id="modal-key-models"
							value={modelsText}
							onChange={(e) => setModelsText(e.target.value)}
							className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder-gray-500"
							rows={2}
							placeholder={t("api_keys.allowed_models_placeholder")}
						/>
						<p className={hintCls}>
							Comma or newline separated. Leave empty for{" "}
							{t("api_keys.allowed_models_all").toLowerCase()}.
						</p>
					</div>

					{/* Allowed IPs */}
					<div>
						<label htmlFor="modal-key-ips" className={labelCls}>
							{t("api_keys.allowed_ips")}
						</label>
						<textarea
							id="modal-key-ips"
							value={ipsText}
							onChange={(e) => setIpsText(e.target.value)}
							className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder-gray-500"
							rows={2}
							placeholder={t("api_keys.allowed_ips_placeholder")}
						/>
						<p className={hintCls}>
							Comma or newline separated. Leave empty for{" "}
							{t("api_keys.allowed_ips_all").toLowerCase()}.
						</p>
					</div>

					<div className="flex justify-end gap-3">
						<Button variant="secondary" onClick={handleClose}>
							{t("common.cancel")}
						</Button>
						<Button type="submit">{t("common.save")}</Button>
					</div>
				</form>
			)}
		</Modal>
	);
}
