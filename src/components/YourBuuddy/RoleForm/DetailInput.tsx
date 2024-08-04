import { XMarkIcon } from "@heroicons/react/24/outline";
import {
  type FieldError,
  type FieldErrorsImpl,
  type Merge,
} from "react-hook-form";
import InputFeedbackMessage from "~/components/common/InputFeedbackMessage";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Input } from "~/components/ui/input";

type DetailInputProps = {
  onRemove: (id: string) => void;
  id: string;
  allowed: boolean;
  description: string;
  index: number;
  error?: Merge<
    FieldError,
    FieldErrorsImpl<{ id: string; allowed: boolean; description: string }>
  >;
  onChangeDescription: (detailId: string, value: string) => void;
  onChangeAllowed: (detailId: string, check: boolean) => void;
};

const DetailInput = ({
  onRemove,
  id,
  allowed,
  description,
  index,
  error,
  onChangeAllowed,
  onChangeDescription,
}: DetailInputProps) => {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-2">
        <div className="w-full">
          <Input
            placeholder="Type here..."
            defaultValue={description}
            status={error?.description && "ERROR"}
            onBlur={(e) => {
              onChangeDescription(id, e.target.value);
            }}
          />
        </div>
        <div className="flex min-w-12 items-center justify-center">
          <Checkbox
            id="allowed"
            onCheckedChange={(checked) => {
              if (typeof checked === "boolean") {
                onChangeAllowed(id, checked);
              }
            }}
            defaultChecked={allowed}
          />
        </div>
        <div className="flex min-w-12 justify-center">
          {index !== 0 && (
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                onRemove(id);
              }}
            >
              <XMarkIcon className="text-mochaText h-5 min-w-5" />
            </Button>
          )}
        </div>
      </div>
      {error?.description && (
        <InputFeedbackMessage
          status="ERROR"
          message={error?.description.message}
        />
      )}
    </div>
  );
};

export default DetailInput;
