import {
	ThreadListItemPrimitive,
	ThreadListPrimitive,
} from "@assistant-ui/react";
import {
	ArchiveBoxIcon,
	ArchiveBoxXMarkIcon,
	ChatBubbleLeftRightIcon,
	EllipsisHorizontalIcon,
	PlusIcon,
	TrashIcon,
} from "@heroicons/react/24/outline";
import { type FC, useState } from "react";
import { useTranslation } from "react-i18next";

export const ChatThreadList: FC = () => {
	const { t } = useTranslation();
	return (
		<ThreadListPrimitive.Root className="flex h-full flex-col">
			<div className="flex items-center justify-between px-3 py-3">
				<h2 className="text-sm font-semibold text-gray-900 dark:text-white">
					{t("chat.threads")}
				</h2>
				<ThreadListPrimitive.New asChild>
					<button
						type="button"
						className="flex size-7 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-gray-200"
						aria-label={t("chat.new_thread")}
					>
						<PlusIcon className="size-4" />
					</button>
				</ThreadListPrimitive.New>
			</div>
			<div className="flex-1 overflow-y-auto px-2 pb-2">
				<ThreadListPrimitive.Items
					components={{ ThreadListItem }}
				/>
			</div>
		</ThreadListPrimitive.Root>
	);
};

const ThreadListItem: FC = () => {
	const [showMenu, setShowMenu] = useState(false);

	return (
		<ThreadListItemPrimitive.Root className="group relative mb-0.5 flex items-center rounded-lg transition-colors data-active:bg-brand-50 data-active:text-brand-700 dark:data-active:bg-brand-500/15 dark:data-active:text-brand-300">
			<ThreadListItemPrimitive.Trigger className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100 group-data-active:bg-transparent group-data-active:text-brand-700 dark:text-gray-300 dark:hover:bg-white/5 dark:group-data-active:text-brand-300">
				<ChatBubbleLeftRightIcon className="size-4 shrink-0 opacity-50" />
				<ThreadListItemPrimitive.Title
					fallback="New Thread"
					className="truncate"
				/>
			</ThreadListItemPrimitive.Trigger>
			<div className="absolute right-1 flex items-center opacity-0 transition-opacity group-hover:opacity-100 group-data-active:opacity-100">
				<button
					type="button"
					onClick={() => setShowMenu((v) => !v)}
					className="flex size-6 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-white/10 dark:hover:text-gray-300"
				>
					<EllipsisHorizontalIcon className="size-4" />
				</button>
			</div>
			{showMenu && (
				<div
					className="absolute right-0 top-full z-30 mt-1 w-36 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-white/10 dark:bg-gray-800"
					onMouseLeave={() => setShowMenu(false)}
				>
					<ThreadListItemPrimitive.Archive asChild>
						<button
							type="button"
							onClick={() => setShowMenu(false)}
							className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
						>
							<ArchiveBoxIcon className="size-3.5" />
							Archive
						</button>
					</ThreadListItemPrimitive.Archive>
					<ThreadListItemPrimitive.Unarchive asChild>
						<button
							type="button"
							onClick={() => setShowMenu(false)}
							className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
						>
							<ArchiveBoxXMarkIcon className="size-3.5" />
							Unarchive
						</button>
					</ThreadListItemPrimitive.Unarchive>
					<ThreadListItemPrimitive.Delete asChild>
						<button
							type="button"
							onClick={() => setShowMenu(false)}
							className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
						>
							<TrashIcon className="size-3.5" />
							Delete
						</button>
					</ThreadListItemPrimitive.Delete>
				</div>
			)}
		</ThreadListItemPrimitive.Root>
	);
};
