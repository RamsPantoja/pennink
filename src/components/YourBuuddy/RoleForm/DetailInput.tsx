import { XCircleIcon } from "@heroicons/react/24/outline";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Input } from "~/components/ui/input";

type DetailInputProps = {
    onRemove: (id: string) => void
    id: string;
    allowed: boolean;
    description: string;
    index: number
}

const DetailInput = ({ onRemove, id, allowed, description, index }: DetailInputProps) => {
    return (
        <div className="flex items-center gap-2">
            <div className="w-full">
                <Input
                    placeholder="Escribe aquí..."
                    defaultValue={description}
                />
            </div>
            <div className="min-w-12 flex justify-center">
                <Checkbox
                    id="allowed"
                    onCheckedChange={(checked) => {
                        console.log(checked);
                    }}
                    defaultChecked={allowed}
                />
            </div>
            <div className="min-w-12 flex justify-center">
                {
                    index !== 0 &&
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                            onRemove(id);
                        }}
                    >
                        <XCircleIcon className="text-blackMain min-w-5 h-5" />
                    </Button>
                }

            </div>
        </div>
    )
}

export default DetailInput;