import { PencilIcon } from "@heroicons/react/24/outline";
import { BuuddyButton } from "~/components/common/BuuddyButton";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "~/components/ui/sheet";

const ProfileEditor = () => {
    return <Sheet>
        <SheetTrigger asChild>
            <BuuddyButton startIcon={<PencilIcon className="h-5 min-w-5 text-blackMain" />} variant="secondary">Editar perfil</BuuddyButton>
        </SheetTrigger>
        <SheetContent>
            <SheetHeader>
                <SheetTitle>Editar perfil</SheetTitle>
                <SheetDescription>
                    La información de tu perfil será visible para el público en general.
                </SheetDescription>
            </SheetHeader>
            <div className="flex min-w-96">
                <p>Hola!</p>
            </div>
            <SheetFooter>
                <SheetClose asChild>
                    <BuuddyButton variant="default">Guardar cambios</BuuddyButton>
                </SheetClose>
            </SheetFooter>
        </SheetContent>
    </Sheet>

}
export default ProfileEditor;