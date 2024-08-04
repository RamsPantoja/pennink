import { BuuddyButton } from "~/components/common/BuuddyButton";
import DetailInput from "./DetailInput";
import { PlusCircleIcon } from "@heroicons/react/24/outline";
import { type DetailSchema } from "./useRoleFormLogic";
import {
  type FieldError,
  type FieldErrorsImpl,
  type Merge,
} from "react-hook-form";

type DetailListProps = {
  onRemove: (id: string) => void;
  onAdd: () => void;
  details: DetailSchema[];
  errors:
    | Merge<
        FieldError,
        (
          | Merge<
              FieldError,
              FieldErrorsImpl<{
                id: string;
                allowed: boolean;
                description: string;
              }>
            >
          | undefined
        )[]
      >
    | undefined;
  handleOnChangeDescriptionDetail: (detailId: string, value: string) => void;
  handleOnChangeAllowedDetail: (detailId: string, check: boolean) => void;
};

const DetailList = ({
  onRemove,
  onAdd,
  details,
  errors,
  handleOnChangeDescriptionDetail,
  handleOnChangeAllowedDetail,
}: DetailListProps) => {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-1">
        <div className="flex w-full gap-2">
          <span className="text-mochaSubText w-full text-xs">Description</span>
          <span className="text-mochaSubText min-w-12 text-center text-xs">
            Allow
          </span>
          <span className="text-mochaSubText min-w-12 text-center text-xs"></span>
        </div>
        {details.map((detail, index) => {
          return (
            <DetailInput
              key={detail.id}
              onRemove={onRemove}
              id={detail.id}
              allowed={detail.allowed}
              description={detail.description}
              index={index}
              error={errors ? errors[index] : undefined}
              onChangeDescription={handleOnChangeDescriptionDetail}
              onChangeAllowed={handleOnChangeAllowedDetail}
            />
          );
        })}
      </div>
      <BuuddyButton
        variant="secondary"
        startIcon={<PlusCircleIcon className="h-5 min-w-5" />}
        onClick={onAdd}
        className="w-fit"
      >
        Add detail
      </BuuddyButton>
    </div>
  );
};

export default DetailList;
