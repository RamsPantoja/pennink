"use client";

import { cn } from "~/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type SidebarItemProps } from "./_types";

const SibedarItem = ({ href, Icon, label }: SidebarItemProps) => {
  const pathname = usePathname();

  return (
    <li className="flex flex-row items-center gap-2">
      <Link className="flex w-full" href={href}>
        <div
          className={cn(
            "flex w-full flex-row items-center gap-2 rounded-md p-2",
            {
              " bg-mochaMantle":
                pathname === href
                  ? true
                  : !pathname.startsWith("/") && pathname.includes(href),
            },
          )}
        >
          <Icon
            className={cn("text-mochaSubText h-4 w-4", {
              " text-mochaMauve":
                pathname === href
                  ? true
                  : !pathname.startsWith("/") && pathname.includes(href),
            })}
          />
          <p
            className={cn("text-mochaSubText text-sm font-bold", {
              " text-mochaMauve":
                pathname === href
                  ? true
                  : !pathname.startsWith("/") && pathname.includes(href),
            })}
          >
            {label}
          </p>
        </div>
      </Link>
    </li>
  );
};

export default SibedarItem;
