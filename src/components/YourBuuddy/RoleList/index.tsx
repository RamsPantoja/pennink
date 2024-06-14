import RoleCard from "./RoleCard";

const RoleList = () => {
    return (
        <div className="flex gap-1 flex-col">
            <RoleCard
                role="English tutor"
                hourPrice={250}
                description="Una pequena descripcion, jeje"
            />
            <RoleCard
                role="Writer"
                hourPrice={450}
                description="Otra pequena descripcion, jeje"
            />
        </div>
    )
}

export default RoleList;