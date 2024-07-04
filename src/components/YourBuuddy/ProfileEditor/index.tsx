import { PencilIcon } from "@heroicons/react/24/outline";
import { BuuddyButton } from "~/components/common/BuuddyButton";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "~/components/ui/sheet";
import ProfileForm from "./ProfileForm";

const ProfileEditor = () => {
    return <Sheet>
        <SheetTrigger asChild>
            <BuuddyButton startIcon={<PencilIcon className="h-5 min-w-5 text-blackMain" />} variant="secondary">Edit profile</BuuddyButton>
        </SheetTrigger>
        <SheetContent className="flex flex-col h-full overflow-hidden">
            <SheetHeader>
                <SheetTitle>Edit profile</SheetTitle>
                <SheetDescription>
                    La información de tu perfil será visible para el público en general.
                </SheetDescription>
            </SheetHeader>
            <ProfileForm />
            <SheetFooter>
                <SheetClose asChild>
                    <BuuddyButton variant="default">Guardar cambios</BuuddyButton>
                </SheetClose>
            </SheetFooter>
        </SheetContent>
    </Sheet>

}
export default ProfileEditor;