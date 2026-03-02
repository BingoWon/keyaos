export function utcToLocal(utcMs: number): number {
	const d = new Date(utcMs);
	return (
		Date.UTC(
			d.getFullYear(),
			d.getMonth(),
			d.getDate(),
			d.getHours(),
			d.getMinutes(),
		) / 1000
	);
}

export function isDarkMode(): boolean {
	return document.documentElement.classList.contains("dark");
}

export function getThemeColors(dark: boolean) {
	return {
		textColor: dark ? "#9ca3af" : "#6b7280",
		gridColor: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
		borderColor: dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
	};
}
