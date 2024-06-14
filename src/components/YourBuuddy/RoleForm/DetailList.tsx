import { BuuddyButton } from "~/components/common/BuuddyButton";
import DetailInput from "./DetailInput";
import { PlusCircleIcon } from "@heroicons/react/24/outline";
import { type DetailSchema } from "./useRoleFormLogic";

type DetailListProps = {
    onRemove: (id: string) => void
    onAdd: () => void
    details: DetailSchema[]
}

const DetailList = ({ onRemove, onAdd, details }: DetailListProps) => {
    return (
        <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-1">
                <div className="flex gap-2 w-full">
                    <span className="text-grayMain text-xs w-full">Descripción</span>
                    <span className="text-grayMain text-xs min-w-12 text-center">Permitir</span>
                    <span className="text-grayMain text-xs min-w-12 text-center"></span>
                </div>
                {
                    details.map((detail, index) => {
                        return (
                            <DetailInput
                                key={detail.id}
                                onRemove={onRemove}
                                id={detail.id}
                                allowed={detail.allowed}
                                description={detail.description}
                                index={index}
                            />
                        )
                    })
                }
            </div>
            <BuuddyButton
                variant="secondary"
                endIcon={<PlusCircleIcon className="min-w-5 h-5" />}
                onClick={onAdd}
                className="w-fit"
            >Agregar detalle</BuuddyButton>
        </div>
    )
}

export default DetailList;