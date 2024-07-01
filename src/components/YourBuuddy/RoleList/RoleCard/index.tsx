import { Card } from "~/components/ui/card";
import RoleDetails from "./RoleDetails";
import { type UserRoleDetail } from "~/server/api/services/userRole";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "~/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/ui/tooltip";
import { BuuddyButton } from "~/components/common/BuuddyButton";
import { EllipsisVerticalIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import RoleForm from "../../RoleForm";
import useRoleCardLogic from "./useRoleCardLogic";
import CustomAlertDialog from "~/components/common/AlertDialog";

type RoleCardProps = {
    role: string
    hourPrice: string
    description: string
    details: UserRoleDetail[]
    userRoleId: string
}

const RoleCard = ({ role, hourPrice, description, details, userRoleId }: RoleCardProps) => {
    const {
        setDisplayRoleForm,
        displayRoleForm,
        displayDeleteRolAlertDialog,
        setDisplayDeleteRolAlertDialog,
        onDeleteUserRol,
        deleteUserRoleMutationIsPending
    } = useRoleCardLogic();

    return (
        <Card className="flex gap-2 flex-col border">
            <CustomAlertDialog
                cancelText="Cancelar"
                actionText="Confirmar"
                title="Eliminar rol"
                description={`¡Atención! ¿Estás seguro de que quieres eliminar el rol <<${role}>>?`}
                onCancel={() => {
                    setDisplayDeleteRolAlertDialog(false);
                }}
                onAction={() => {
                    onDeleteUserRol(userRoleId);
                }}
                isPending={deleteUserRoleMutationIsPending}
                open={displayDeleteRolAlertDialog}
            />
            {
                displayRoleForm &&
                <RoleForm
                    open={displayRoleForm}
                    onOpenChange={setDisplayRoleForm}
                    userRoleId={userRoleId}
                />
            }
            <div className="flex items-center justify-between">
                <span className="text-blackMain font-bold">{role}</span>
                <DropdownMenu>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <DropdownMenuTrigger asChild>
                                <BuuddyButton size="icon" startIcon={<EllipsisVerticalIcon className="h-5 min-w-5 text-blackMain" />} variant='ghost'>{""}</BuuddyButton>
                            </DropdownMenuTrigger>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p className="text-whiteMain">Más opciones</p>
                        </TooltipContent>
                    </Tooltip>
                    <DropdownMenuContent
                    >
                        <DropdownMenuItem
                            onSelect={() => {
                                setDisplayDeleteRolAlertDialog(true);
                            }}
                        >
                            <TrashIcon className="mr-2 h-4 min-w-4" />
                            Eliminar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onSelect={() => {
                                setDisplayRoleForm(true);
                            }}
                        >
                            <PencilIcon className="mr-2 h-4 w-4" />
                            Editar
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
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