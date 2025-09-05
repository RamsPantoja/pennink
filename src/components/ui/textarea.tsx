import * as React from "react";

import { cn } from "~/lib/utils";

export type TextareaProps =
	React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
		status?: "SUCCESS" | "ERROR" | "WARNING";
	};

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
	({ className, status, ...props }, ref) => {
		return (
			<textarea
				className={cn(
					"placeholder:text-mocha-sub-text border-mocha-sub-text bg-mocha-mantle text-mocha-text flex min-h-[80px] w-full rounded-md border border-transparent px-3 py-2 text-sm focus:shadow-md focus:ring-2 focus:ring-mocha-crust focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50",
					{
						"border-red-500": status === "ERROR",
						"border-green-500": status === "SUCCESS",
						"border-yellow-500": status === "WARNING",
					},
					className,
				)}
				ref={ref}
				{...props}
			/>
		);
	},
);
Textarea.displayName = "Textarea";

export { Textarea };
