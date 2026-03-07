/**
 * Shim: next/navigation → react-router-dom
 */
import {
	useLocation,
	useNavigate,
	useParams as useRRParams,
} from "react-router-dom";

export function useRouter() {
	const navigate = useNavigate();
	return {
		push: (url: string) => navigate(url),
		replace: (url: string) => navigate(url, { replace: true }),
		back: () => navigate(-1),
		forward: () => navigate(1),
		refresh: () => window.location.reload(),
		prefetch: () => {},
	};
}

export function useParams<
	T extends Record<string, string> = Record<string, string>,
>(): T {
	return useRRParams() as T;
}

export function usePathname(): string {
	const location = useLocation();
	return location.pathname;
}

export function useSearchParams(): [
	URLSearchParams,
	(params: URLSearchParams) => void,
] {
	const location = useLocation();
	const navigate = useNavigate();
	const params = new URLSearchParams(location.search);
	const setParams = (newParams: URLSearchParams) => {
		navigate(`${location.pathname}?${newParams.toString()}`, { replace: true });
	};
	return [params, setParams];
}

export function notFound(): never {
	throw new Response("Not Found", { status: 404 });
}
