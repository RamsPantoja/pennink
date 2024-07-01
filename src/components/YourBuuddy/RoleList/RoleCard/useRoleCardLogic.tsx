import { useState } from "react";
import { toast } from "sonner";
import { api } from "~/utils/api";

// type useRoleCardLogicProps = {

// }

const useRoleCardLogic = () => {
    const utils = api.useUtils();
    const [displayRoleForm, setDisplayRoleForm] = useState<boolean>(false);
    const [displayDeleteRolAlertDialog, setDisplayDeleteRolAlertDialog] = useState<boolean>(false);

    const { mutate: deleteUserRoleMutation, isPending: deleteUserRoleMutationIsPending } = api.userRole.delete.useMutation({
        onSuccess: async () => {
            toast.success('Role eliminado correctamente');
            setDisplayDeleteRolAlertDialog(false);
            await utils.userTime.userTimes.invalidate();
            await utils.userRole.userRoles.invalidate();
        },
        onError: (error) => {
            toast.error(error.message);
        }
    });

    const onDeleteUserRol = (userRoleId: string) => {
        deleteUserRoleMutation({
            id: userRoleId
        });
    }

    return {
        setDisplayRoleForm,
        displayRoleForm,
        displayDeleteRolAlertDialog,
        setDisplayDeleteRolAlertDialog,
        onDeleteUserRol,
        deleteUserRoleMutationIsPending
    }
}

export default useRoleCardLogic;