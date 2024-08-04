type RoleCardProps = {
  name: string;
  description: string;
};

const RoleCard = ({ name, description }: RoleCardProps) => {
  return (
    <div className="w-full max-w-96">
      <span className="text-sm font-bold">{name}</span>
      <p className="font-semibold">{description}</p>
    </div>
  );
};

export default RoleCard;
