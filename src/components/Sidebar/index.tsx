"use client";

import SibedarItem from "./SidebarItem";
import { signOut } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { type Session } from "next-auth";
import CustomAlertDialog from "../common/AlertDialog";
import useSidebarLogic from "./useSidebarLogic";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import {
  Cog6ToothIcon,
  CurrencyDollarIcon,
  EllipsisVerticalIcon,
  PaperAirplaneIcon,
  PowerIcon,
  UserGroupIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { BuuddyButton } from "../common/BuuddyButton";
import BuuddyLogotype from "../common/BuuddyLogotype";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

type SidebarProps = {
  session: Session | null;
};

const Sidebar = ({ session }: SidebarProps) => {
  const router = useRouter();

  const { displaySignOutAlert, setDisplaySignOutAlert } = useSidebarLogic();

  return (
    <nav className="flex h-full w-full flex-col gap-4">
      <div className="flex items-center gap-2 text-mochaText">
        <BuuddyLogotype />
      </div>
      <ul className="flex h-full w-full flex-col">
        <SibedarItem Icon={UserGroupIcon} label="Rent and connect" href="/" />
        {session && (
          <SibedarItem
            Icon={PaperAirplaneIcon}
            label="Booking requests"
            href="/booking_requests"
          />
        )}
        {session && (
          <SibedarItem
            Icon={CurrencyDollarIcon}
            label="Orders"
            href="/payments"
          />
        )}
        {session && (
          <SibedarItem
            Icon={UserIcon}
            label="Your buuddy"
            href="/your_buuddy"
          />
        )}
      </ul>
      {session && (
        <div className="flex w-full flex-row items-center justify-between gap-2">
          <div className="flex flex-row items-center gap-2 overflow-hidden">
            <Avatar className=" h-7 w-7">
              <AvatarImage src={session.user.image!} />
              <AvatarFallback>Tú</AvatarFallback>
            </Avatar>
            <p className="truncate text-xs font-bold text-mochaText">
              {session.user.name}
            </p>
          </div>
          <div className="flex items-center">
            <CustomAlertDialog
              cancelText="Cancel"
              actionText="Sign out"
              title="Sign out"
              description={"Warning! Are you sure you want to sign out?"}
              onCancel={() => {
                setDisplaySignOutAlert(false);
              }}
              onAction={() => signOut({ callbackUrl: "/sign_in" })}
              isPending={false}
              open={displaySignOutAlert}
            />
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <BuuddyButton
                      size="icon"
                      startIcon={
                        <EllipsisVerticalIcon className="h-5 min-w-5 text-mochaText" />
                      }
                      variant="ghost"
                    >
                      {""}
                    </BuuddyButton>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-mochaBase">More options</p>
                </TooltipContent>
              </Tooltip>
              <DropdownMenuContent
                onCloseAutoFocus={(e) => {
                  e.preventDefault();
                }}
              >
                <DropdownMenuItem
                  onSelect={() => {
                    router.push("/settings");
                  }}
                >
                  <Cog6ToothIcon className="mr-2 h-5 min-w-5 text-mochaText" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => {
                    setDisplaySignOutAlert(true);
                  }}
                >
                  <PowerIcon className="mr-2 h-5 min-w-5 text-mochaText" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}
      {!session && (
        <div className="flex w-full flex-row items-center justify-between gap-2">
          <BuuddyButton
            variant="secondary"
            className="w-full"
            onClick={() => {
              router.push("/sign_in");
            }}
          >
            Sign in
          </BuuddyButton>
        </div>
      )}
    </nav>
  );
};

export default Sidebar;
