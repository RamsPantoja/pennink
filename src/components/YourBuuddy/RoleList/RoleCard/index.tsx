import { Card } from "~/components/ui/card";

type RoleCardProps = {
    role: string
    hourPrice: number
    description: string
}

const RoleCard = ({ role, hourPrice, description }: RoleCardProps) => {
    return (
        <Card className="flex gap-2 flex-col border">
            <span className="text-blackMain font-bold">{role}</span>
            <p className="text-grayMain text-sm">{description}</p>
            <div className="flex items-end gap-2">
                <span className="font-bold text-blackMain">${hourPrice} MXN</span>
                <span className="text-sm">hora</span>
            </div>
        </Card>
    )
}

export default RoleCard;