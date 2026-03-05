import {
	Dialog,
	DialogBackdrop,
	DialogPanel,
	TransitionChild,
} from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import type { ReactNode } from "react";
import { Suspense, useState } from "react";
import { Outlet } from "react-router-dom";
import { PageLoader } from "./PageLoader";

interface BaseSidebarLayoutProps {
	navigation: (onClose?: () => void) => ReactNode;
}

export function BaseSidebarLayout({ navigation }: BaseSidebarLayoutProps) {
	const [sidebarOpen, setSidebarOpen] = useState(false);

	return (
		<div>
			{/* Mobile sidebar dialog */}
			<Dialog
				open={sidebarOpen}
				onClose={setSidebarOpen}
				className="relative z-50 lg:hidden"
			>
				<DialogBackdrop
					transition
					className="fixed inset-0 bg-gray-900/80 transition-opacity duration-300 ease-linear data-closed:opacity-0"
				/>
				<div className="fixed inset-0 flex">
					<DialogPanel
						transition
						className="relative mr-16 flex w-full max-w-xs flex-1 transform transition duration-300 ease-in-out data-closed:-translate-x-full"
					>
						<TransitionChild>
							<div className="absolute top-0 left-full flex w-16 justify-center pt-5 duration-300 ease-in-out data-closed:opacity-0">
								<button
									type="button"
									onClick={() => setSidebarOpen(false)}
									className="-m-2.5 p-2.5"
								>
									<span className="sr-only">Close sidebar</span>
									<XMarkIcon aria-hidden="true" className="size-6 text-white" />
								</button>
							</div>
						</TransitionChild>
						<div className="flex grow flex-col overflow-y-auto bg-white px-6 pt-4 pb-2 dark:bg-gray-900 dark:ring dark:ring-white/10">
							{navigation(() => setSidebarOpen(false))}
						</div>
					</DialogPanel>
				</div>
			</Dialog>

			{/* Desktop sidebar — starts below top nav */}
			<div className="hidden lg:fixed lg:inset-y-0 lg:top-14 lg:z-40 lg:flex lg:w-64 lg:flex-col">
				<div className="flex grow flex-col overflow-y-auto border-r border-gray-200 bg-white px-6 pt-4 dark:border-white/10 dark:bg-black/10">
					{navigation()}
				</div>
			</div>

			{/* Mobile hamburger bar — below top nav */}
			<div className="sticky top-14 z-40 flex items-center gap-x-6 bg-white px-4 py-3 shadow-xs sm:px-6 lg:hidden dark:border-b dark:border-white/10 dark:bg-gray-900 dark:shadow-none">
				<button
					type="button"
					onClick={() => setSidebarOpen(true)}
					className="-m-2.5 p-2.5 text-gray-700 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
				>
					<span className="sr-only">Open sidebar</span>
					<Bars3Icon aria-hidden="true" className="size-6" />
				</button>
			</div>

			{/* Main content — below top nav, right of sidebar */}
			<main className="min-h-dvh pt-14 lg:pl-64">
				<div className="px-4 py-8 sm:px-6 lg:px-8">
					<Suspense fallback={<PageLoader />}>
						<Outlet />
					</Suspense>
				</div>
			</main>
		</div>
	);
}
