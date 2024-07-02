import { type Session } from "next-auth";
import { Card } from "../ui/card";
import RoleList from "./RoleList";
import AvailableHours from "./AvailableHours";
import Profile from "./Profile";

type YourBuuddyContainerProps = {
    session: Session
}

const YourBuuddyContainer = ({ session }: YourBuuddyContainerProps) => {
    return (
        <div className=" flex flex-col w-full h-full gap-2 p-4">
            <Profile session={session} />
            <div className="flex w-full h-full overflow-hidden">
                <Card className="flex flex-col gap-2 min-w-96">
                    <span className="text-blackMain font-bold">Roles</span>
                    <RoleList />
                </Card>
                <Card className="flex flex-col gap-2">
                    <span className="text-blackMain font-bold">Planificación y disponibilidad</span>
                    <AvailableHours session={session} />
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