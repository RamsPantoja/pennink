import { InformationCircleIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { Label } from "~/components/ui/label"
import { Switch } from "~/components/ui/switch"
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/ui/tooltip";
import { api } from "~/utils/api";

type RentModeSwitchProps = {
    isActive: boolean
}

const RentModeSwitch = ({ isActive }: RentModeSwitchProps) => {
    const utils = api.useUtils();

    const { mutate: buuddyModeMutation, isPending: buuddyModeMutationIsPending } = api.user.buuddyMode.useMutation({
        onSuccess: async () => {
            await utils.user.userById.invalidate();
        },
        onError: (error) => {
            toast.error(error.message);
        }
    });

    const handleOnChangeBuuddyMode = (checked: boolean) => {
        buuddyModeMutation({
            isActive: checked
        })
    };

    return (
        <div className="flex gap-2 items-center pl-4 pt-4 h-fit">
            <Switch
                disabled={buuddyModeMutationIsPending}
                id="rent-mode"
                onCheckedChange={handleOnChangeBuuddyMode}
                defaultChecked={isActive}
            />
            <Label className="font-bold" htmlFor="rent-mode">Buuddy mode</Label>
            <Tooltip>
                <TooltipTrigger asChild>
                    <InformationCircleIcon className="h-5 w-5 text-grayMain" />
                </TooltipTrigger>
                <TooltipContent className=" bg-blackMain border-none max-w-60">
                    <p className="text-whiteMain">Activate to appear as a buddy on the platform and start offering your services.</p>
                </TooltipContent>
            </Tooltip>
        </div>
    )
}

export default RentModeSwitch;