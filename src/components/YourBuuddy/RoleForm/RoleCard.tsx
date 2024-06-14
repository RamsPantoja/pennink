type RoleCardProps = {
    name: string
    description: string
}

const RoleCard = ({ name, description }: RoleCardProps) => {
    return (
        <div className="max-w-96 w-full">
            <span className="text-blackMain font-bold text-sm">{name}</span>
            <p className="text-grayMain font-semibold">{description}</p>
        </div>
    )
}

export default RoleCard;