"use client";

import * as React from "react";
import * as TogglePrimitive from "@radix-ui/react-toggle";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "~/lib/utils";

const toggleVariants = cva(
	"inline-flex items-center justify-center rounded-md text-xs font-semibold ring-offset-white transition-colors hover:bg-mocha-mantle hover:text-mocha-text focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-mocha-mantle data-[state=on]:text-mocha-text",
	{
		variants: {
			variant: {
				default: "bg-mocha-base text-mocha-sub-text",
				outline:
					"border border-mocha-mauve bg-mocha-crust text-mocha-sub-text hover:bg-accent hover:text-accent-foreground data-[state=on]:bg-mocha-crust data-[state=on]:border-mocha-teal data-[state=on]:text-mocha-text",
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
