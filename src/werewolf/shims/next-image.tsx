/**
 * Shim: next/image → native <img>
 * Preserves all layout/sizing props for visual consistency.
 */
import { forwardRef, type ImgHTMLAttributes } from "react";

interface ImageProps
	extends Omit<ImgHTMLAttributes<HTMLImageElement>, "width" | "height"> {
	src: string;
	alt: string;
	width?: number | string;
	height?: number | string;
	fill?: boolean;
	priority?: boolean;
	quality?: number;
	placeholder?: "blur" | "empty";
	blurDataURL?: string;
	unoptimized?: boolean;
	sizes?: string;
}

const Image = forwardRef<HTMLImageElement, ImageProps>(
	(
		{
			src,
			alt,
			fill,
			priority: _priority,
			quality: _quality,
			placeholder: _placeholder,
			blurDataURL: _blur,
			unoptimized: _unoptimized,
			sizes: _sizes,
			...rest
		},
		ref,
	) => {
		const fillStyle = fill
			? {
					position: "absolute" as const,
					inset: 0,
					width: "100%",
					height: "100%",
					objectFit: "cover" as const,
				}
			: {};
		return (
			<img
				ref={ref}
				src={src}
				alt={alt}
				style={{ ...fillStyle, ...((rest.style as object) ?? {}) }}
				{...rest}
			/>
		);
	},
);

Image.displayName = "Image";
export default Image;
