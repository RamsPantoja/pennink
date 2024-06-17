import { XMarkIcon } from "@heroicons/react/24/outline";
import { Button } from "~/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";

const hoursList: string[] = [
    "00:00",
    "01:00",
    "02:00",
    "03:00",
    "04:00",
    "05:00",
    "06:00",
    "07:00",
    "08:00",
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
    "18:00",
    "19:00",
    "20:00",
    "21:00",
    "22:00",
    "23:00",
];

const Interval = () => {
    return (
        <div className="flex gap-2 items-center">
            <div className="flex gap-1 items-center ">
                <Select
                >
                    <SelectTrigger className=" w-24">
                        <SelectValue placeholder="Hora" />
                    </SelectTrigger>
                    <SelectContent>
                        {
                            hoursList.map((hour, index) => {
                                return (
                                    <SelectItem key={index} value={hour}>{hour}</SelectItem>
                                )
                            })
                        }
                    </SelectContent>
                </Select>
                <span className="font-black text-lg">-</span>
                <Select
                >
                    <SelectTrigger className="w-24">
                        <SelectValue placeholder="Hora" />
                    </SelectTrigger>
                    <SelectContent>
                        {
                            hoursList.map((hour, index) => {
                                return (
                                    <SelectItem key={index} value={hour}>{hour}</SelectItem>
                                )
                            })
                        }
                    </SelectContent>
                </Select>
            </div>
            <div className="min-w-12 flex justify-center">
                <Button
                    size="icon"
                    variant="ghost"
                >
                    <XMarkIcon className="text-blackMain min-w-5 h-5" />
                </Button>
            </div>
        </div>
    )
}

export default Interval;