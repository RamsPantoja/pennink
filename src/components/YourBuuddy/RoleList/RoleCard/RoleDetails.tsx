import { CheckIcon, NoSymbolIcon } from "@heroicons/react/24/outline";
import { BuuddyButton } from "~/components/common/BuuddyButton";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { type UserRoleDetail } from "~/server/api/services/userRole";

type RoleDetailsProps = {
  details: UserRoleDetail[];
};

const RoleDetails = ({ details }: RoleDetailsProps) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <BuuddyButton variant="outline">See details</BuuddyButton>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Details</DialogTitle>
          <DialogDescription>Details allowed and not allowed</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <div className="flex w-full gap-2">
            <span className="w-full text-xs text-mochaSubText">
              Description
            </span>
            <span className="min-w-12 text-center text-xs text-mochaSubText">
              Allowed
            </span>
          </div>
          {details.map((item) => {
            return (
              <Detail
                key={item.id}
                description={item.description}
                allowed={item.allowed}
              />
            );
          })}
        </div>
        <DialogFooter className="flex flex-row items-center justify-between gap-2">
          <DialogClose asChild>
            <BuuddyButton type="button" variant="secondary">
              Close
            </BuuddyButton>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

type DetailProps = {
  description: string;
  allowed: boolean;
};

const Detail = ({ description, allowed }: DetailProps) => {
  return (
    <div className="flex gap-2">
      <p className="w-full font-semibold text-mochaText">{description}</p>
      <div className="flex min-w-12 items-center justify-center">
        {allowed ? (
          <CheckIcon className="h-5 min-w-5 text-mochaText" />
        ) : (
          <NoSymbolIcon className="h-5 min-w-5 text-mochaText" />
        )}
      </div>
    </div>
  );
};

export default RoleDetails;
