import {
	Listbox,
	ListboxButton,
	ListboxOption,
	ListboxOptions,
} from "@headlessui/react";
import {
	ChevronUpDownIcon,
	KeyIcon,
	PlusIcon,
} from "@heroicons/react/20/solid";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../auth";
import { useFetch } from "../hooks/useFetch";
import { CreateApiKeyModal } from "./CreateApiKeyModal";
import { Button } from "./ui";

interface ApiKeyInfo {
	id: string;
	name: string;
	keyHint: string;
	isEnabled: boolean;
	createdAt: number;
}

const CREATE_SENTINEL = "__create__";

interface ApiKeyPickerProps {
	onChange: (plainKey: string | null) => void;
}

export function ApiKeyPicker({ onChange }: ApiKeyPickerProps) {
	const { isSignedIn, getToken } = useAuth();
	const { t } = useTranslation();
	const { data: keys, refetch } = useFetch<ApiKeyInfo[]>("/api/api-keys");

	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [revealCache] = useState(() => new Map<string, string>());
	const [createOpen, setCreateOpen] = useState(false);

	if (!isSignedIn) return null;
	if (!keys) return null;

	const enabledKeys = keys.filter((k) => k.isEnabled);
	const selectedKey = enabledKeys.find((k) => k.id === selectedId);

	const revealAndNotify = async (id: string) => {
		const cached = revealCache.get(id);
		if (cached) {
			onChange(cached);
			return;
		}
		try {
			const res = await fetch(`/api/api-keys/${id}/reveal`, {
				headers: { Authorization: `Bearer ${await getToken()}` },
			});
			if (res.ok) {
				const { key } = await res.json();
				revealCache.set(id, key);
				onChange(key);
			}
		} catch {
			/* reveal failed silently */
		}
	};

	const handleSelect = (val: string) => {
		if (val === CREATE_SENTINEL) {
			setCreateOpen(true);
			return;
		}
		setSelectedId(val);
		revealAndNotify(val);
	};

	const handleCreated = (key: {
		id: string;
		name: string;
		plainKey: string;
	}) => {
		revealCache.set(key.id, key.plainKey);
		setSelectedId(key.id);
		onChange(key.plainKey);
		refetch();
	};

	if (enabledKeys.length === 0) {
		return (
			<>
				<Button size="sm" onClick={() => setCreateOpen(true)}>
					<KeyIcon className="-ml-0.5 size-4" />
					{t("api_keys.add_new")}
				</Button>
				<CreateApiKeyModal
					open={createOpen}
					onClose={() => setCreateOpen(false)}
					onCreated={handleCreated}
				/>
			</>
		);
	}

	return (
		<>
			<Listbox value={selectedId} onChange={handleSelect}>
				<div className="relative">
					<ListboxButton className="relative w-56 cursor-pointer rounded-lg border border-gray-200 bg-white py-1.5 pl-3 pr-10 text-left text-sm shadow-sm transition-colors hover:border-gray-300 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20">
						<span
							className={
								selectedKey
									? "text-gray-900 dark:text-white"
									: "text-gray-400 dark:text-gray-500"
							}
						>
							{selectedKey?.name ?? t("api_keys.select", "Select API key")}
						</span>
						<span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
							<ChevronUpDownIcon className="size-4 text-gray-400" />
						</span>
					</ListboxButton>
					<ListboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 text-sm shadow-lg focus:outline-none dark:border-white/10 dark:bg-gray-800">
						{enabledKeys.map((k) => (
							<ListboxOption
								key={k.id}
								value={k.id}
								className="cursor-pointer px-3 py-2 text-gray-900 data-[focus]:bg-brand-50 data-[selected]:font-medium dark:text-white dark:data-[focus]:bg-white/5"
							>
								{k.name}
							</ListboxOption>
						))}
						<div className="border-t border-gray-100 dark:border-white/5">
							<ListboxOption
								value={CREATE_SENTINEL}
								className="flex cursor-pointer items-center gap-1.5 px-3 py-2 text-brand-600 data-[focus]:bg-brand-50 dark:text-brand-400 dark:data-[focus]:bg-white/5"
							>
								<PlusIcon className="size-4" />
								{t("api_keys.add_new")}
							</ListboxOption>
						</div>
					</ListboxOptions>
				</div>
			</Listbox>
			<CreateApiKeyModal
				open={createOpen}
				onClose={() => setCreateOpen(false)}
				onCreated={handleCreated}
			/>
		</>
	);
}
