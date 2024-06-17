import { api } from "~/utils/api";
import RoleCard from "./RoleCard";
import { mapSkeletons } from "~/lib/utils";
import RoleCardSkeleton from "./RoleCard/RoleCardSkeleton";
import { Fragment } from "react";
import FeedbackMessage from "~/components/common/FeedbackMessage";

const RoleList = () => {
    const { data: userRolesData, isError: userRolesIsError, isLoading: userRolesIsLoading } = api.userRole.userRoles.useQuery();
    const skeletons = mapSkeletons({ numberOfSkeletons: 10, skeleton: <RoleCardSkeleton /> })

    return (
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
    )
}

export default RoleList;