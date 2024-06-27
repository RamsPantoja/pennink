import { type Session } from "next-auth";
import BuuddyCard from "./BuuddyCard";
import RentModeSwitch from "./RentMode";
import { Card } from "../ui/card";
import RoleList from "./RoleList";
import RoleForm from "./RoleForm";
import AvailableHours from "./AvailableHours";

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
            <div className="flex w-full h-full overflow-hidden">
                <Card className="flex flex-col gap-2 min-w-96">
                    <span className="text-blackMain font-bold">Roles</span>
                    <RoleList />
                    <div className="flex justify-end items-center">
                        <RoleForm />
                    </div>
                </Card>
                <Card className="flex flex-col gap-2">
                    <span className="text-blackMain font-bold">Planificación y disponibilidad</span>
                    <AvailableHours />
                </Card>
                <Card className="flex flex-col gap-2 w-full">
                    <span className="text-blackMain font-bold">Solicitudes de reservación</span>
                    <Card className="border w-full h-full overflow-auto">

                    </Card>
                </Card>
            </div>
        </div>
    )
}

export default YourBuuddyContainer;