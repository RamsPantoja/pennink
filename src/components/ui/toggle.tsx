"use client";

import * as React from "react";
import * as TogglePrimitive from "@radix-ui/react-toggle";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "~/lib/utils";

const toggleVariants = cva(
	"inline-flex items-center justify-center rounded-md text-sm font-semibold ring-offset-white transition-colors hover:bg-mochaMantle hover:text-mochaText focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-mochaMantle data-[state=on]:text-mochaMauve",
	{
		variants: {
			variant: {
				default: "bg-mochaBase text-mochaSubText",
				outline:
					"border border-slate-200 bg-transparent data-[state=on]:border-mochaMauve hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-50",
			},
			size: {
				default: "h-10 px-3",
				sm: "h-9 px-2.5",
				lg: "h-11 px-5",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

const Toggle = React.forwardRef<
	React.ElementRef<typeof TogglePrimitive.Root>,
	React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root> &
		VariantProps<typeof toggleVariants>
>(({ className, variant, size, ...props }, ref) => (
	<TogglePrimitive.Root
		ref={ref}
		className={cn(toggleVariants({ variant, size, className }))}
		{...props}
	/>
));

Toggle.displayName = TogglePrimitive.Root.displayName;

export { Toggle, toggleVariants };
