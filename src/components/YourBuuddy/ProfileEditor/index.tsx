import { BuuddyButton } from "~/components/common/BuuddyButton";
import ProfileForm from "./ProfileForm";
import useProfileFormLogic from "./ProfileForm/useProfileFormLogic";
import { Card } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { Fragment } from "react";

type ProfileEditor = {
    onSuccessCallback?: () => void
}

const ProfileEditor = ({ onSuccessCallback }: ProfileEditor) => {
    const {
        useProfileForm,
        interestData,
        interestIsLoading,
        interestIsError,
        onSave,
        upsertProfileMutationIsPending,
        userProfileIsLoading
    } = useProfileFormLogic({ onSuccessCallback });

    return <Card className="flex flex-col gap-4 w-full h-full max-w-screen-md">
        {
            userProfileIsLoading && <Card className="flex gap-4 flex-col w-full">
                <div className="space-y-2 w-full">
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2 w-full">
                    <Skeleton className="h-5 w-60" />
                    <Skeleton className="h-5 w-full" />
                </div>
                <div className="space-y-2 w-full">
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2 w-full">
                    <Skeleton className="h-5 w-60" />
                    <Skeleton className="h-5 w-full" />
                </div>
            </Card>
        }
        {
            !userProfileIsLoading && <Fragment>
                <p className="text-sm text-grayMain">The information about your profile will be visible for general public.</p>
                <ProfileForm
                    useProfileForm={useProfileForm}
                    interestData={interestData}
                    interestIsError={interestIsError}
                    interestIsLoading={interestIsLoading}
                />
                <div className="flex justify-end">
                    <BuuddyButton isPending={upsertProfileMutationIsPending} onClick={useProfileForm.handleSubmit(onSave)} variant="default">Save</BuuddyButton>
                </div>
            </Fragment>
        }
    </Card>

}
export default ProfileEditor;