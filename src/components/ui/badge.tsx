import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "~/lib/utils";

const badgeVariants = cva(
	"inline-flex items-center w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-hidden focus:ring-2 focus:ring-slate-950 focus:ring-offset-2",
	{
		variants: {
			variant: {
				default:
					"dark:bg-mocha-teal dark:text-mocha-crust hover:bg-mocha-teal/80",
				secondary:
					"dark:bg-mocha-mantle dark:text-mocha-text hover:bg-mocha-mantle/80",
				destructive:
					"border-transparent bg-red-500 text-slate-50 hover:bg-red-500/80",
				outline: "border border-mocha-mauve bg-mocha-crust text-mocha-text",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
);

export interface BadgeProps
	extends React.HTMLAttributes<HTMLDivElement>,
		VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
	return (
		<div className={cn(badgeVariants({ variant }), className)} {...props} />
	);
}

export { Badge, badgeVariants };
