import Link from "next/link";
import { Fragment } from "react";
import { BuuddyButton } from "~/components/common/BuuddyButton";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Card } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { type BookingRequestStatus } from "~/lib/enum";

type BookingRequestCardBuuddyProps = {
  id: string;
  status: BookingRequestStatus;
  bookingTime: string;
  bookingDate: Date;
  message: string | null;
  senderName: string;
  senderAvatar: string;
  senderHeadline: string;
  senderUsername: string;
};

const BookingRequestBuuddyCard = ({
  bookingTime,
  bookingDate,
  message,
  senderName,
  senderAvatar,
  senderHeadline,
  senderUsername,
  id,
  status
}: BookingRequestCardBuuddyProps) => {
  return (
    <Card className="flex flex-col gap-2 bg-mochaMantle p-4 max-w-sm max-h-80 min-h-80">
      <div className="flex justify-between gap-2">
        <div className="flex basis-full items-center gap-4 overflow-hidden">
          <Avatar className="h-12 min-w-12">
            <AvatarImage src={senderAvatar} />
            <AvatarFallback>Tú</AvatarFallback>
          </Avatar>
          <div className="flex flex-1 flex-col overflow-hidden">
            <Link
              href={`/profile/${senderUsername}`}
              className="max-w-fit truncate font-semibold text-mochaText hover:underline"
            >
              {senderName}
            </Link>
            <span className="truncate text-sm text-mochaSubText">
              {senderHeadline}
            </span>
          </div>
        </div>
        <span className="text-sm text-mochaMauve">{status}</span>
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
      <div className="flex justify-end gap-2 items-end h-full">
        {
          status === "PENDING" &&
          <Fragment>
            <BuuddyButton
              variant="outline"
              className="w-fit"
              onClick={() => console.log("Decline")}
            >
              Reject
            </BuuddyButton>
            <BuuddyButton className="w-fit" onClick={() => console.log("Accept")}>
              Accept
            </BuuddyButton>
          </Fragment>
        }
        {
          status === "ACCEPTED" && <span className="text-sm text-mochaSubText">Waiting for payment</span>
        }
        {
          status === "CANCELED" && <span className="text-sm text-mochaSubText">Canceled by user</span>
        }
        {
          status === "PAID" && (
            <BuuddyButton
              variant="outline"
              className="w-fit"
              onClick={() => console.log("PAY")}
            >
              Details
            </BuuddyButton>
          )
        }
      </div>
    </Card>
  );
};

export default BookingRequestBuuddyCard;
