import { type Session } from "next-auth";
import BuuddyCard from "./BuuddyCard";
import RentModeSwitch from "./RentMode";
import { BuuddyButton } from "../common/BuuddyButton";
import { PlusCircleIcon } from "@heroicons/react/24/outline";
import { Card } from "../ui/card";

type YourBuuddyContainerProps = {
    session: Session
}

const YourBuuddyContainer = ({ session }: YourBuuddyContainerProps) => {
    return (
        <div className=" flex flex-col w-full h-full gap-2 p-4">
            <div className=" flex gap-2">
                <BuuddyCard session={session} />
                <RentModeSwitch />
            </div>
            <div className="flex w-full h-full gap-2">
                <Card className="flex flex-col gap-2 border-2 border-whiteLigth min-w-96">
                    <span className="text-blackMain font-bold">Roles</span>
                    <BuuddyButton
                        variant="secondary"
                        endIcon={<PlusCircleIcon className="min-w-5 h-5" />}
                    >Agregar role</BuuddyButton>
                </Card>
                <Card className="flex flex-col gap-2 border-2 border-whiteLigth w-full">
                    <span className="text-blackMain font-bold">Planificación y disponibilidad</span>
                </Card>
            </div>
        </div>
    )
}

export default YourBuuddyContainer;