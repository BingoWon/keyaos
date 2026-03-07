/**
 * Shim: next/script → native <script> via useEffect
 */
import { type ReactNode, useEffect } from "react";

interface ScriptProps {
	id?: string;
	src?: string;
	strategy?: "beforeInteractive" | "afterInteractive" | "lazyOnload" | "worker";
	onLoad?: () => void;
	onReady?: () => void;
	onError?: (e: Error) => void;
	children?: ReactNode;
	type?: string;
	dangerouslySetInnerHTML?: { __html: string };
}

export default function Script({
	id,
	src,
	dangerouslySetInnerHTML,
	type,
	onLoad,
}: ScriptProps) {
	useEffect(() => {
		if (!src && !dangerouslySetInnerHTML?.__html) return;
		const script = document.createElement("script");
		if (id) script.id = id;
		if (type) script.type = type;
		if (src) {
			script.src = src;
			script.async = true;
			if (onLoad) script.onload = onLoad;
		} else if (dangerouslySetInnerHTML?.__html) {
			script.textContent = dangerouslySetInnerHTML.__html;
		}
		document.head.appendChild(script);
		return () => {
			script.remove();
		};
	}, [id, src, dangerouslySetInnerHTML, type, onLoad]);
	return null;
}
