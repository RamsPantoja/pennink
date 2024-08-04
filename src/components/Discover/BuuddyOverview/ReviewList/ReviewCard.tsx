import { StarIcon } from "@heroicons/react/24/outline";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Card } from "~/components/ui/card";

const ReviewCard = () => {
  return (
    <Card className="flex flex-col gap-2 border">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Avatar className=" h-12 w-12">
            <AvatarImage src={""} />
            <AvatarFallback>Tú</AvatarFallback>
          </Avatar>
          <div className="ml-4">
            <h4 className="font-semibold">Jane Cooper</h4>
            <span className="text-mochaSubText text-sm">
              CEO at ABC Corporation
            </span>
          </div>
        </div>
        <div className="flex flex-row items-center gap-1">
          <span className="text-sm font-semibold">4.3</span>
          <StarIcon className="h-4 w-4 " />
        </div>
      </div>
      <p className="text-mochaSubText text-sm">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed sit amet
        accumsan arcu. Proin ac consequat arcu. Quisque molestie arcu nec sapien
        aliquam, eget ultricies mi tincidunt. Donec sit amet semper dui. Sed
        auctor, nunc vel tincidunt luctus, nunc turpis porta nunc, nec fermentum
        nunc metus nec nunc.
      </p>
    </Card>
  );
};

export default ReviewCard;
