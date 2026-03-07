/**
 * Shim: next/link → react-router-dom Link
 */
import { type AnchorHTMLAttributes, forwardRef, type ReactNode } from "react";
import { Link as RRLink } from "react-router-dom";

interface LinkProps
	extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
	href: string;
	children?: ReactNode;
	prefetch?: boolean;
	replace?: boolean;
	scroll?: boolean;
	shallow?: boolean;
	locale?: string | false;
	legacyBehavior?: boolean;
}

const Link = forwardRef<HTMLAnchorElement, LinkProps>(
	(
		{
			href,
			children,
			prefetch: _prefetch,
			replace,
			scroll: _scroll,
			shallow: _shallow,
			locale: _locale,
			legacyBehavior: _legacy,
			...rest
		},
		ref,
	) => {
		if (
			href.startsWith("http") ||
			href.startsWith("mailto:") ||
			href.startsWith("//")
		) {
			return (
				<a ref={ref} href={href} {...rest}>
					{children}
				</a>
			);
		}
		return (
			<RRLink ref={ref} to={href} replace={replace} {...rest}>
				{children}
			</RRLink>
		);
	},
);

Link.displayName = "Link";
export default Link;
