import Link from "next/link";
import { BuuddyButton } from "~/components/common/BuuddyButton";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Card } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";

type BookingRequestCardProps = {
  bookingTime: string;
  bookingDate: Date;
  message: string | null;
  receiverName: string;
  receiverAvatar: string;
  receiverHeadline: string;
  receiverUsername: string;
}

const BookingRequestCard = ({ bookingDate, bookingTime, message, receiverName, receiverAvatar, receiverHeadline, receiverUsername }: BookingRequestCardProps) => {
  return (
    <Card className="flex flex-col gap-2 bg-mochaMantle p-4 max-w-sm max-h-80 min-h-80">
      <div className="flex justify-between gap-2">
        <div className="flex basis-full items-center gap-4 overflow-hidden">
          <Avatar className="h-12 min-w-12">
            <AvatarImage src={receiverAvatar} />
            <AvatarFallback>Tú</AvatarFallback>
          </Avatar>
          <div className="flex flex-1 flex-col overflow-hidden">
            <Link
              href={`/profile/${receiverUsername}`}
              className="max-w-fit truncate font-semibold text-mochaText hover:underline"
            >
              {receiverName}
            </Link>
            <span className="truncate text-sm text-mochaSubText">
              {receiverHeadline}
            </span>
          </div>
        </div>
        <span className="text-sm text-mochaMauve">Pending</span>
      </div>
      <div className="flex flex-col gap-2 pb-2 pt-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-mochaSubText">Date</span>
          <span className="text-mochaText">
            {bookingDate.toLocaleDateString()}
          </span>
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <span className="text-sm text-mochaSubText">Time</span>
          <span className="text-mochaText">{bookingTime}</span>
        </div>
        <Separator />
        <div className="flex flex-col">
          <span className="text-sm text-mochaSubText">Message</span>
          <span className="text-mochaText">{message}</span>
        </div>
      </div>
      <div className="flex w-full flex-1 items-end justify-end">
        <BuuddyButton
          variant="outline"
          className="w-fit"
          onClick={() => console.log("Decline")}
        >
          Cancel
        </BuuddyButton>
      </div>
    </Card>
  );
}

export default BookingRequestCard;