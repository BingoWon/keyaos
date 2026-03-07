import { cn } from "@wolf/lib/utils";
import * as React from "react";

const Label = React.forwardRef<HTMLLabelElement, React.ComponentProps<"label">>(
	({ className, ...props }, ref) => {
		return (
			<label
				ref={ref}
				className={cn(
					"text-sm font-medium text-[var(--text-primary)]",
					className,
				)}
				{...props}
			/>
		);
	},
);
Label.displayName = "Label";

export { Label };
