import { InformationCircleIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { cn } from "~/lib/utils";
import { api } from "~/utils/api";

type RentModeSwitchProps = {
  isActive: boolean;
};

const RentModeSwitch = ({ isActive }: RentModeSwitchProps) => {
  const utils = api.useUtils();

  const { mutate: buuddyModeMutation, isPending: buuddyModeMutationIsPending } =
    api.user.buuddyMode.useMutation({
      onSuccess: async () => {
        await utils.user.userById.invalidate();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });

  const handleOnChangeBuuddyMode = (checked: boolean) => {
    buuddyModeMutation({
      isActive: checked,
    });
  };

  return (
    <div className="flex h-fit items-center gap-2 pl-4 pt-4">
      <Switch
        disabled={buuddyModeMutationIsPending}
        id="rent-mode"
        onCheckedChange={handleOnChangeBuuddyMode}
        defaultChecked={isActive}
      />
      <Label
        className={cn([
          "font-semibold text-mochaSubText",
          {
            "text-mochaText": isActive,
          },
        ])}
        htmlFor="rent-mode"
      >
        Buuddy mode
      </Label>
      <Tooltip>
        <TooltipTrigger asChild>
          <InformationCircleIcon className="h-5 w-5 text-mochaSubText" />
        </TooltipTrigger>
        <TooltipContent>
          <p>
            Activate to appear as a buddy on the platform and start offering
            your services.
          </p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
};

export default RentModeSwitch;
