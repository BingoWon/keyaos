import { LoginContent } from "../auth";
import { LanguageSelector } from "../components/LanguageSelector";
import { ThemeToggle } from "../components/ThemeToggle";

export function Login() {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center px-6 py-12 bg-gray-50 dark:bg-gray-900 transition-colors">
			<div className="absolute top-4 right-4 flex items-center gap-2">
				<ThemeToggle />
				<LanguageSelector />
			</div>
			<LoginContent />
		</div>
	);
}
