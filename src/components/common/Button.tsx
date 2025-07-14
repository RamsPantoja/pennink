import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "~/lib/utils";

const buttonVariants = cva(
	"inline-flex gap-2 items-center justify-center whitespace-nowrap rounded-md text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
	{
		variants: {
			variant: {
				default: "text-mochaBase bg-mochaText hover:bg-mochaText/80",
				teal: "text-mochaCrust bg-mochaTeal hover:bg-mochaTeal/80",
				destructive:
					"bg-destructive text-destructive-foreground hover:bg-destructive/90",
				outline:
					"border border-mochaMauve bg-mochaCrust text-mochaText hover:bg-accent hover:text-accent-foreground",
				secondary: "bg-mochaMantle text-mochaText hover:bg-mochaMantle/80",
				ghost:
					"hover:bg-accent hover:text-accent-foreground hover:bg-mochaMantle/80 text-mochaText",
				link: "text-mochaSubText underline-offset-4 hover:underline ",
			},
			size: {
				default: "h-10 px-4 py-2",
				sm: "h-9 rounded-md px-3 text-xs",
				lg: "h-11 rounded-md px-8",
				icon: "h-8 min-w-8 w-fit",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

export interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof buttonVariants> {
	isPending?: boolean;
	children: string | React.ReactNode;
	startIcon?: React.ReactNode;
	endIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	(
		{
			className,
			variant,
			size,
			isPending,
			children,
			endIcon,
			startIcon,
			...props
		},
		ref,
	) => {
		const Comp = "button";

		return (
			<Comp
				{...props}
				className={cn(buttonVariants({ variant, size, className }))}
				ref={ref}
				disabled={isPending || props.disabled}
			>
				{isPending && (
					<svg
						className="h-5 w-5 animate-spin text-current"
						fill="none"
						viewBox="0 0 24 24"
						xmlns="http://www.w3.org/2000/svg"
					>
						<circle
							className="opacity-25"
							cx="12"
							cy="12"
							r="10"
							stroke="currentColor"
							strokeWidth="4"
						/>
						<path
							className="opacity-75"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
							fill="currentColor"
						/>
					</svg>
				)}
				{!isPending && startIcon}
				{isPending && size !== "icon" && "Wait..."}
				{!isPending && children}
				{!isPending && endIcon}
			</Comp>
		);
	},
);

Button.displayName = "Button";

export { Button, buttonVariants };
