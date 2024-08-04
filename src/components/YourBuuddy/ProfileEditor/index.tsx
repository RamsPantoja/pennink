import { BuuddyButton } from "~/components/common/BuuddyButton";
import ProfileForm from "./ProfileForm";
import useProfileFormLogic from "./ProfileForm/useProfileFormLogic";
import { Card } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { Fragment } from "react";

type ProfileEditor = {
  onSuccessCallback?: () => void;
};

const ProfileEditor = ({ onSuccessCallback }: ProfileEditor) => {
  const {
    useProfileForm,
    interestData,
    interestIsLoading,
    interestIsError,
    onSave,
    upsertProfileMutationIsPending,
    userProfileIsLoading,
  } = useProfileFormLogic({ onSuccessCallback });

  return (
    <Card className="flex h-full w-full max-w-screen-md flex-col gap-4">
      {userProfileIsLoading && (
        <Card className="flex w-full flex-col gap-4">
          <div className="w-full space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="w-full space-y-2">
            <Skeleton className="h-5 w-60" />
            <Skeleton className="h-5 w-full" />
          </div>
          <div className="w-full space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="w-full space-y-2">
            <Skeleton className="h-5 w-60" />
            <Skeleton className="h-5 w-full" />
          </div>
        </Card>
      )}
      {!userProfileIsLoading && (
        <Fragment>
          <p className="text-mochaSubText text-sm">
            The information about your profile will be visible for general
            public.
          </p>
          <ProfileForm
            useProfileForm={useProfileForm}
            interestData={interestData}
            interestIsError={interestIsError}
            interestIsLoading={interestIsLoading}
          />
          <div className="flex justify-end">
            <BuuddyButton
              isPending={upsertProfileMutationIsPending}
              onClick={useProfileForm.handleSubmit(onSave)}
              variant="default"
            >
              Save
            </BuuddyButton>
          </div>
        </Fragment>
      )}
    </Card>
  );
};
export default ProfileEditor;
