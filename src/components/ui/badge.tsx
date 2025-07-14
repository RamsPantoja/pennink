import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "~/lib/utils";

const badgeVariants = cva(
	"inline-flex items-center w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 dark:border-slate-800 dark:focus:ring-slate-300",
	{
		variants: {
			variant: {
				default:
					"bg-mochaTeal text-mochaCrust hover:bg-mochaTeal/80 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-50/80",
				secondary:
					"bg-mochaMantle text-mochaText hover:bg-mochaMantle/80 dark:bg-slate-800 dark:text-slate-50 dark:hover:bg-slate-800/80",
				destructive:
					"border-transparent bg-red-500 text-slate-50 hover:bg-red-500/80 dark:bg-red-900 dark:text-slate-50 dark:hover:bg-red-900/80",
				outline: "border border-mochaMauve bg-mochaCrust text-mochaText",
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
