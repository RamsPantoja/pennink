"use client";

import { cn } from "~/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SidebarItemProps } from "./_types";

const SibedarItem = ({ href, Icon, label }: SidebarItemProps) => {
	const pathname = usePathname();

	return (
		<Link
			className={cn("flex w-full flex-row items-center gap-4 rounded-md p-2", {
				" bg-mochaMantle":
					pathname === href
						? true
						: !pathname.startsWith("/") && pathname.includes(href),
			})}
			href={href}
		>
			<Icon
				className={cn("text-mochaSubText h-5 min-w-5", {
					" text-mochaMauve":
						pathname === href
							? true
							: !pathname.startsWith("/") && pathname.includes(href),
				})}
			/>
			<p
				className={cn("text-mochaSubText truncate text-sm font-bold", {
					" text-mochaMauve":
						pathname === href
							? true
							: !pathname.startsWith("/") && pathname.includes(href),
				})}
			>
				{label}
			</p>
		</Link>
	);
};

export default SibedarItem;
