import {
	BookOpenIcon,
	ChatBubbleLeftRightIcon,
	CpuChipIcon,
	MagnifyingGlassIcon,
	ServerStackIcon,
} from "@heroicons/react/24/outline";
import { type FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { isPlatform, UserMenu, useAuth } from "../auth";
import { classNames } from "../utils/classNames";
import { LanguageSelector } from "./LanguageSelector";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

const GITHUB_URL = "https://github.com/BingoWon/Keyaos";

function GitHubIcon({ className }: { className?: string }) {
	return (
		<svg
			viewBox="0 0 16 16"
			className={className}
			fill="currentColor"
			aria-hidden="true"
		>
			<path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
		</svg>
	);
}

const NAV_LINKS = [
	{ key: "nav.models", href: "/models", icon: CpuChipIcon },
	{ key: "nav.providers", href: "/providers", icon: ServerStackIcon },
	{ key: "nav.chat", href: "/chat", icon: ChatBubbleLeftRightIcon },
	{ key: "nav.docs", href: "/docs", icon: BookOpenIcon },
] as const;

function ModelSearch() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const [q, setQ] = useState("");

	const onSubmit = (e: FormEvent) => {
		e.preventDefault();
		const trimmed = q.trim();
		navigate(trimmed ? `/models?q=${encodeURIComponent(trimmed)}` : "/models");
		setQ("");
	};

	return (
		<form onSubmit={onSubmit} className="hidden lg:flex">
			<div className="relative">
				<MagnifyingGlassIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
				<input
					type="text"
					value={q}
					onChange={(e) => setQ(e.target.value)}
					placeholder={t("models.search_placeholder")}
					className="h-8 w-52 rounded-lg border border-gray-200 bg-gray-50 pl-8 pr-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-colors focus:border-brand-400 focus:bg-white focus:ring-1 focus:ring-brand-400/30 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-brand-500 dark:focus:bg-white/10"
				/>
			</div>
		</form>
	);
}

export function TopNav() {
	const { t } = useTranslation();
	const { isLoaded, isSignedIn } = useAuth();
	const authed = isLoaded && isSignedIn;

	return (
		<header className="fixed inset-x-0 top-0 z-50 h-14 border-b border-gray-200/50 bg-white/70 backdrop-blur-lg dark:border-white/5 dark:bg-gray-950/70">
			<nav className="flex h-full items-center justify-between px-4 lg:px-6">
				<div className="flex items-center gap-4">
					<Logo size="md" />
					<ModelSearch />
				</div>

				<div className="flex items-center gap-1">
					{NAV_LINKS.map(({ key, href }) => (
						<NavLink
							key={href}
							to={href}
							className={({ isActive }) =>
								classNames(
									"hidden rounded-lg px-3 py-1.5 text-sm font-medium transition-colors sm:inline-flex",
									isActive
										? "text-brand-600 dark:text-brand-400"
										: "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white",
								)
							}
						>
							{t(key)}
						</NavLink>
					))}

					<div className="mx-1.5 hidden h-4 w-px bg-gray-200 sm:block dark:bg-white/10" />

					<ThemeToggle />
					<LanguageSelector />
					<a
						href={GITHUB_URL}
						target="_blank"
						rel="noopener noreferrer"
						className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
						aria-label="GitHub"
					>
						<GitHubIcon className="size-5" />
					</a>

					<div className="mx-1.5 hidden h-4 w-px bg-gray-200 sm:block dark:bg-white/10" />

					{authed ? (
						<div className="flex items-center gap-2">
							<Link
								to="/dashboard"
								className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white shadow-sm shadow-brand-500/20 transition-colors hover:bg-brand-600 dark:hover:bg-brand-400"
							>
								{t("nav.dashboard")}
							</Link>
							{isPlatform && <UserMenu />}
						</div>
					) : (
						<div className="flex items-center gap-1.5">
							<Link
								to="/login"
								className="hidden items-center px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:text-gray-900 sm:inline-flex dark:text-gray-400 dark:hover:text-white"
							>
								{t("landing.cta_signup")}
							</Link>
							<Link
								to="/login"
								className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white shadow-sm shadow-brand-500/20 transition-colors hover:bg-brand-600 dark:hover:bg-brand-400"
							>
								{t("landing.cta_signin")}
							</Link>
						</div>
					)}
				</div>
			</nav>
		</header>
	);
}
