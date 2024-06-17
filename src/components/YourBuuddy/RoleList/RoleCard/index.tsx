import { Card } from "~/components/ui/card";
import RoleDetails from "./RoleDetails";
import { type UserRoleDetail } from "~/server/api/services/userRole";

type RoleCardProps = {
    role: string
    hourPrice: string
    description: string
    details: UserRoleDetail[]
}

const RoleCard = ({ role, hourPrice, description, details }: RoleCardProps) => {
    return (
        <Card className="flex gap-2 flex-col border">
            <span className="text-blackMain font-bold">{role}</span>
            <p className="text-grayMain text-sm">{description}</p>
            <div className="flex items-end gap-2">
                <span className="font-bold text-blackMain">${hourPrice} MXN</span>
                <span className="text-sm">hora</span>
            </div>
            <div className="flex justify-end">
                <RoleDetails
                    details={details}
                />
            </div>
        </Card>
    )
}

export default RoleCard;