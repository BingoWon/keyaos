import { ApiReferenceReact } from "@scalar/api-reference-react";
import "@scalar/api-reference-react/style.css";

export function ApiReference() {
	return (
		<div className="-mx-4 -mt-8 -mb-10 sm:-mx-6 lg:-mx-8 lg:-mt-8">
			<ApiReferenceReact
				configuration={{
					url: "/openapi.json",
					hideDownloadButton: false,
					darkMode: document.documentElement.classList.contains("dark"),
					metaData: {
						title: "Keyaos API Reference",
					},
				}}
			/>
		</div>
	);
}
