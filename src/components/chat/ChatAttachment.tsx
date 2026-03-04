import { AttachmentPrimitive } from "@assistant-ui/react";
import { DocumentTextIcon, XMarkIcon } from "@heroicons/react/24/outline";
import type { FC } from "react";
import { classNames } from "../../utils/classNames";

export const ComposerAttachment: FC = () => (
	<AttachmentPrimitive.Root className="relative group">
		<div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-1.5 pr-7 dark:border-white/10 dark:bg-white/5">
			<AttachmentThumb />
			<span className="max-w-[120px] truncate text-xs text-gray-600 dark:text-gray-400">
				<AttachmentPrimitive.Name />
			</span>
		</div>
		<AttachmentPrimitive.Remove asChild>
			<button
				type="button"
				className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 opacity-0 shadow-sm transition-opacity hover:bg-gray-100 group-hover:opacity-100 dark:border-white/10 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600"
			>
				<XMarkIcon className="size-3" />
				<span className="sr-only">Remove</span>
			</button>
		</AttachmentPrimitive.Remove>
	</AttachmentPrimitive.Root>
);

export const UserMessageAttachment: FC = () => (
	<AttachmentPrimitive.Root className="inline-block">
		<AttachmentThumb className="size-14" />
	</AttachmentPrimitive.Root>
);

const AttachmentThumb: FC<{ className?: string }> = ({ className }) => (
	<AttachmentPrimitive.unstable_Thumb
		className={classNames(
			"flex size-10 items-center justify-center overflow-hidden rounded-md bg-gray-100 dark:bg-white/10 [&>img]:size-full [&>img]:object-cover",
			className,
		)}
	>
		<DocumentTextIcon className="size-5 text-gray-400 dark:text-gray-500" />
	</AttachmentPrimitive.unstable_Thumb>
);
