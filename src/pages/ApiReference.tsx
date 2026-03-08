import { ApiReferenceReact } from "@scalar/api-reference-react";
import "@scalar/api-reference-react/style.css";
import { useEffect, useState } from "react";

export function ApiReference() {
	const [darkMode, setDarkMode] = useState(
		document.documentElement.classList.contains("dark"),
	);

	useEffect(() => {
		const observer = new MutationObserver(() => {
			setDarkMode(document.documentElement.classList.contains("dark"));
		});
		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ["class"],
		});
		return () => observer.disconnect();
	}, []);

	return (
		<div className="scalar-wrapper">
			<style>{`
				.scalar-wrapper {
					position: fixed;
					inset: 0;
					top: 3.5rem;
				}
				.scalar-wrapper > .scalar-app,
				.scalar-wrapper > div {
					height: 100% !important;
					max-height: 100% !important;
				}
			`}</style>
			<ApiReferenceReact
				key={String(darkMode)}
				configuration={{
					url: "/openapi.json",
					hideDownloadButton: false,
					darkMode,
					metaData: {
						title: "Keyaos API Reference",
					},
				}}
			/>
		</div>
	);
}
