import { PencilIcon } from "@heroicons/react/24/outline";
import { BuuddyButton } from "~/components/common/BuuddyButton";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "~/components/ui/sheet";
import ProfileForm from "./ProfileForm";
import useProfileFormLogic from "./ProfileForm/useProfileFormLogic";

const ProfileEditor = () => {
    const {
        useProfileForm,
        interestData,
        interestIsLoading,
        interestIsError,
        onSave,
        upsertProfileMutationIsPending
    } = useProfileFormLogic();

    return <Sheet>
        <SheetTrigger asChild>
            <BuuddyButton startIcon={<PencilIcon className="h-5 min-w-5 text-blackMain" />} variant="secondary">Edit profile</BuuddyButton>
        </SheetTrigger>
        <SheetContent className="flex flex-col h-full overflow-hidden">
            <SheetHeader>
                <SheetTitle>Edit profile</SheetTitle>
                <SheetDescription>
                    The information about your profile will be visible for general public.
                </SheetDescription>
            </SheetHeader>
            <ProfileForm
                useProfileForm={useProfileForm}
                interestData={interestData}
                interestIsError={interestIsError}
                interestIsLoading={interestIsLoading}
            />
            <SheetFooter>
                <SheetClose asChild>
                    <BuuddyButton isPending={upsertProfileMutationIsPending} onClick={useProfileForm.handleSubmit(onSave)} variant="default">Save</BuuddyButton>
                </SheetClose>
            </SheetFooter>
        </SheetContent>
    </Sheet>

}
export default ProfileEditor;