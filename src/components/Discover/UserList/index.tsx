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

    console.log(users);

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
                !isLoading && !isError && users && Object.keys(users).map((userId) => {
                    return (
                        <UserCard
                            key={userId}
                            userData={users[userId]}
                        />
                    )
                })
            }
            {
                !isLoading && !isError && users && Object.keys(users).length === 0 &&
                <div className="p-4">
                    <FeedbackMessage status="INFORMATION" message="No buuddies to display" />
                </div>
            }
            {
                !isLoading &&
                isError &&
                <div className="p-4">
                    <FeedbackMessage status="ERROR" message="Something went wrong!" />
                </div>
            }
        </div>
    )
}

export default UserList;


