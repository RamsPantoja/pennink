import { Card } from "~/components/ui/card";
import useProfileLogic from "./useProfileLogic";
import { type Session } from "next-auth";
import { Skeleton } from "~/components/ui/skeleton";
import { Fragment } from "react";
import BuuddyCard from "../BuuddyCard";
import RentModeSwitch from "../RentMode";
import ProfileEditor from "../ProfileEditor";
import FeedbackMessage from "~/components/common/FeedbackMessage";

type ProfileProps = {
    session: Session
}

const Profile = ({ session }: ProfileProps) => {
    const {
        userIsError,
        userIsLoading,
        userData
    } = useProfileLogic({ session });

    return (
        <div className="flex gap-2 justify-between">
            {
                userIsLoading && <Card className="flex gap-2 flex-col w-full">
                    <div className="flex items-center gap-2 w-full">
                        <Skeleton className="min-w-16 h-16 rounded-full " />
                        <div className="space-y-2 w-full">
                            <Skeleton className="h-10 w-full max-w-96" />
                            <Skeleton className="h-4 w-40" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-5 w-full max-w-96" />
                        <Skeleton className="h-4 w-40" />
                    </div>
                </Card>
            }
            {
                !userIsLoading && !userIsError && userData && <Fragment>
                    <div className="flex gap-2">
                        <BuuddyCard session={session} />
                        <RentModeSwitch
                            isActive={userData.buuddyMode}
                        />
                    </div>
                    <ProfileEditor />
                </Fragment>
            }
            {
                !userIsLoading && userIsError && <FeedbackMessage status="ERROR" message="Error al obtener la información del usuario" />
            }
        </div>
    )
}

export default Profile;