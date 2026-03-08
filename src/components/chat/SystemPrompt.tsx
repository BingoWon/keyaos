import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { CommandLineIcon } from "@heroicons/react/24/outline";
import { type FC, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const STORAGE_KEY = "kx-chat-system-prompt";

const TEMPLATES = [
	{ id: "none", label: "None", prompt: "" },
	{
		id: "concise",
		label: "Concise",
		prompt: "Be concise. Reply in 1-3 sentences unless asked for more detail.",
	},
	{
		id: "expert",
		label: "Expert",
		prompt:
			"You are a senior software engineer. Provide precise, production-ready answers with best practices.",
	},
	{
		id: "creative",
		label: "Creative",
		prompt:
			"Be creative and think outside the box. Offer unique perspectives and inventive solutions.",
	},
] as const;

interface SystemPromptProps {
	value: string;
	onChange: (value: string) => void;
}

export const SystemPrompt: FC<SystemPromptProps> = ({ value, onChange }) => {
	const { t } = useTranslation();
	const [draft, setDraft] = useState(value);

	useEffect(() => setDraft(value), [value]);

	const apply = useCallback(
		(v: string) => {
			onChange(v);
			localStorage.setItem(STORAGE_KEY, v);
		},
		[onChange],
	);

	return (
		<Popover className="relative">
			<PopoverButton
				className="flex size-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10"
				aria-label={t("chat.system_prompt")}
			>
				<CommandLineIcon className="size-4" />
			</PopoverButton>
			<PopoverPanel className="absolute left-0 z-30 mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-xl border border-gray-200 bg-white p-3 shadow-lg dark:border-white/10 dark:bg-gray-800">
				<p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
					{t("chat.system_prompt")}
				</p>
				<div className="mb-2 flex flex-wrap gap-1.5">
					{TEMPLATES.map((tmpl) => (
						<button
							key={tmpl.id}
							type="button"
							onClick={() => {
								setDraft(tmpl.prompt);
								apply(tmpl.prompt);
							}}
							className={`rounded-md px-2 py-1 text-xs transition-colors ${
								value === tmpl.prompt
									? "bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300"
									: "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/10 dark:text-gray-400 dark:hover:bg-white/15"
							}`}
						>
							{tmpl.label}
						</button>
					))}
				</div>
				<textarea
					value={draft}
					onChange={(e) => setDraft(e.target.value)}
					onBlur={() => apply(draft)}
					rows={3}
					placeholder={t("chat.system_prompt_placeholder")}
					className="w-full resize-none rounded-lg border border-gray-200 bg-transparent p-2 text-xs text-gray-900 outline-none placeholder:text-gray-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 dark:border-white/10 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-brand-400"
				/>
			</PopoverPanel>
		</Popover>
	);
};

export function loadSystemPrompt(): string {
	try {
		return localStorage.getItem(STORAGE_KEY) || "";
	} catch {
		return "";
	}
}
