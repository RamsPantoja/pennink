import { mapSkeletons } from "~/lib/utils";
import UserCard from "../UserCard";
import UserCardSkeleton from "../UserCard/UserCardSkeleton";
import { Fragment } from "react";
import FeedbackMessage from "~/components/common/FeedbackMessage";
import { type RouterOutputs } from "~/utils/api";

type UserListProps = {
    users?: RouterOutputs["user"]["buuddies"]
    isError: boolean
    isLoading: boolean
}

const UserList = ({ users, isError, isLoading }: UserListProps) => {
    const skeletons = mapSkeletons({ numberOfSkeletons: 15, skeleton: <UserCardSkeleton /> });

    return (
        <div className="flex items-start justify-start gap-2 flex-wrap w-full h-fit">
            {
                isLoading && skeletons.map((skeleton, index) => {
                    return <Fragment key={index}>
                        {skeleton}
                    </Fragment>
                })
            }
            {
                !isLoading && !isError && users?.map((item) => {
                    return (
                        <UserCard
                            key={item.user?.id}
                            name={item.user?.name}
                            verified={item.user?.verified}
                            image={item.user?.image}
                            username={item.profile?.username}
                        />
                    )
                })
            }
            {
                !isLoading && !isError && users?.length === 0 &&
                <div className="p-4">
                    <FeedbackMessage status="INFORMATION" message="Agrega un rol para comenzar a ofrecer tus servicios" />
                </div>
            }
            {
                !isLoading &&
                isError &&
                <div className="p-4">
                    <FeedbackMessage status="ERROR" message="Algo salio mal! No se pueden obtener los roles" />
                </div>
            }
        </div>
    )
}

export default UserList;


