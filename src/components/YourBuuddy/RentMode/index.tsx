import { InformationCircleIcon } from "@heroicons/react/24/outline";
import { Label } from "~/components/ui/label"
import { Switch } from "~/components/ui/switch"
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/ui/tooltip";

const RentModeSwitch = () => {
    return (
        <div className="flex gap-2 items-center pl-4 pt-4 h-fit">
            <Switch  id="rent-mode" />
            <Label className="font-bold" htmlFor="rent-mode">Modo Buuddy</Label>
            <Tooltip>
                <TooltipTrigger asChild>
                    <InformationCircleIcon className="h-5 w-5 text-grayMain" />
                </TooltipTrigger>
                <TooltipContent className=" bg-blackMain border-none max-w-60">
                    <p className="text-whiteMain">Activar para aparecer como un buuddy en la plataforma y comenzar a ofrecer tus servicios.</p>
                </TooltipContent>
            </Tooltip>
        </div>
    )
}

export default RentModeSwitch;