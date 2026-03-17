import mdx from "@mdx-js/rollup";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import remarkGfm from "remark-gfm";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [
		tailwindcss(),
		{ enforce: "pre", ...mdx({ remarkPlugins: [remarkGfm] }) },
		react(),
	],
	resolve: {
		alias: {
			"@wolf": "/src/werewolf",
			"@": "/src",
			"next-intl": "/src/werewolf/i18n/next-intl-shim.ts",
			"next/navigation": "/src/werewolf/shims/next-navigation.ts",
			"next/link": "/src/werewolf/shims/next-link.tsx",
			"next/image": "/src/werewolf/shims/next-image.tsx",
			"next/script": "/src/werewolf/shims/next-script.tsx",
		},
	},
	test: {
		include: ["src/**/*.{test,spec}.{ts,tsx}"],
		exclude: ["tests/e2e/**", "node_modules/**", "references/**"],
		passWithNoTests: true,
	},
});
