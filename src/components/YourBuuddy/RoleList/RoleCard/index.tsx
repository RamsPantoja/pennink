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
                cancelText="Cancel"
                actionText="Delete"
                title="Delete rol"
                description={`Warning! ¿Are you sure you want to delete the role <<${role}>>?`}
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
                {
                    //Important: Use the DropdownMenu with modal prop set to false to avoid modal collisions
                }
                <DropdownMenu modal={false}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <DropdownMenuTrigger asChild>
                                <BuuddyButton size="icon" startIcon={<EllipsisVerticalIcon className="h-5 min-w-5 text-blackMain" />} variant='ghost'>{""}</BuuddyButton>
                            </DropdownMenuTrigger>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p className="text-whiteMain">More options</p>
                        </TooltipContent>
                    </Tooltip>
                    <DropdownMenuContent
                        onCloseAutoFocus={(e) => {
                            e.preventDefault();
                        }}
                    >
                        <DropdownMenuItem
                            onSelect={() => {
                                setDisplayDeleteRolAlertDialog(true);
                            }}
                        >
                            <TrashIcon className="mr-2 h-5 min-w-5" />
                            Delete
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onSelect={() => {
                                setDisplayRoleForm(true);
                            }}
                        >
                            <PencilIcon className="mr-2 h-5 min-w-5" />
                            Edit
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <p className="text-grayMain text-sm">{description}</p>
            <div className="flex items-end gap-2">
                <span className="font-bold text-blackMain">${hourPrice} USD</span>
                <span className="text-sm">hour</span>
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