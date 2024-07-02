import { api } from "~/utils/api";
import RoleCard from "./RoleCard";
import { mapSkeletons } from "~/lib/utils";
import RoleCardSkeleton from "./RoleCard/RoleCardSkeleton";
import { Fragment, useEffect, useState } from "react";
import FeedbackMessage from "~/components/common/FeedbackMessage";
import useYourBuuddyStore from "../useYourBuuddyStore";
import { BuuddyButton } from "~/components/common/BuuddyButton";
import { PlusCircleIcon } from "@heroicons/react/24/outline";
import RoleForm from "../RoleForm";

const RoleList = () => {
    const { data: userRolesData, isError: userRolesIsError, isLoading: userRolesIsLoading } = api.userRole.userRoles.useQuery();
    const skeletons = mapSkeletons({ numberOfSkeletons: 10, skeleton: <RoleCardSkeleton /> });
    const setUserRoles = useYourBuuddyStore((state) => state.setUserRoles);
    const [displayUserRoleForm, setDisplayUserRoleForm] = useState<boolean>(false);

    useEffect(() => {
        if (userRolesData) {
            setUserRoles(userRolesData);
        }
    }, [userRolesData, setUserRoles]);

    return (
        <div className="flex flex-col overflow-hidden gap-2">
            <RoleForm
                open={displayUserRoleForm}
                onOpenChange={setDisplayUserRoleForm}
            />
            <div className="flex gap-1 flex-col overflow-auto">
                {
                    userRolesIsLoading && skeletons.map((skeleton, index) => {
                        return <Fragment key={index}>
                            {skeleton}
                        </Fragment>
                    })
                }
                {
                    !userRolesIsLoading && !userRolesIsError && userRolesData?.map((item) => {
                        return (
                            <RoleCard
                                key={item.id}
                                role={item.role.name}
                                hourPrice={item.hourPrice}
                                description={item.description}
                                details={item.userRoleDetails}
                                userRoleId={item.id}
                            />
                        )
                    })
                }
                {
                    !userRolesIsLoading && !userRolesIsError && userRolesData?.length === 0 &&
                    <div className="p-4">
                        <FeedbackMessage status="INFORMATION" message="Agrega un rol para comenzar a ofrecer tus servicios" />
                    </div>
                }
                {
                    !userRolesIsLoading &&
                    userRolesIsError &&
                    <div className="p-4">
                        <FeedbackMessage status="ERROR" message="Algo salio mal! No se pueden obtener los roles" />
                    </div>
                }
            </div>
            <div className="flex items-center justify-end">
                <BuuddyButton
                    startIcon={<PlusCircleIcon className="min-w-5 h-5" />}
                    onClick={() => setDisplayUserRoleForm(true)}
                >Agregar role</BuuddyButton>
            </div>
        </div>
    )
}

export default RoleList;