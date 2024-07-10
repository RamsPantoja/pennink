import { CheckIcon, NoSymbolIcon } from "@heroicons/react/24/outline";
import { BuuddyButton } from "~/components/common/BuuddyButton";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { type UserRoleDetail } from "~/server/api/services/userRole";


type RoleDetailsProps = {
    details: UserRoleDetail[]
}

const RoleDetails = ({ details }: RoleDetailsProps) => {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <BuuddyButton
                    variant="secondary"
                >See details</BuuddyButton>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Detalles</DialogTitle>
                    <DialogDescription>
                        Details allowed and not allowed
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-2">
                    <div className="flex gap-2 w-full">
                        <span className="text-grayMain text-xs w-full">Description</span>
                        <span className="text-grayMain text-xs min-w-12 text-center">Allowed</span>
                    </div>
                    {
                        details.map((item) => {
                            return (
                                <Detail
                                    key={item.id}
                                    description={item.description}
                                    allowed={item.allowed}
                                />
                            )
                        })
                    }
                </div>
                <DialogFooter className="flex flex-row items-center justify-between gap-2">
                    <DialogClose asChild>
                        <BuuddyButton type="button" variant="secondary">
                            Close
                        </BuuddyButton>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

type DetailProps = {
    description: string
    allowed: boolean
}

const Detail = ({ description, allowed }: DetailProps) => {
    return (
        <div className="flex gap-2">
            <p className="w-full font-semibold">{description}</p>
            <div className="min-w-12 flex justify-center items-center">
                {
                    allowed ? <CheckIcon className="min-w-5 h-5 text-blackMain" /> : <NoSymbolIcon className="min-w-5 h-5 text-blackMain" />
                }
            </div>
        </div>
    )
}

export default RoleDetails;