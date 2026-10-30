import type { FC } from "react";
import { Card } from "../../ui/card";
import type { FormType } from "~/lib/enum";
import { LinksManager } from "../../FormEditor/LinksManager";
import type { CurrentForm } from "../useWorkspaceStore";
import { Badge } from "../../ui/badge";
import { Button } from "../../common/Button";
import { LinkIcon, TrashIcon } from "@heroicons/react/24/outline";
import { cn } from "~/lib/utils";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { sileo } from "sileo";
import { api } from "~/trpc/react";
import CustomAlertDialog from "../../common/AlertDialog";
import { useFormLoaderStore } from "./useFormLoaderStore";

type FormCardProps = {
  id: string;
  title: string;
  type: FormType;
  date: string;
  onOpen: (form: CurrentForm) => void;
  onResults: () => void;
  selectedFormId: string | undefined;
};

export const FormCard: FC<FormCardProps> = ({
  title,
  type,
  date,
  onOpen,
  onResults,
  id,
  selectedFormId,
}) => {
  const t = useTranslations("FormCard");
  const [displayDeleteAlert, setDisplayDeleteAlert] = useState<boolean>(false);
  const utils = api.useUtils();
  const {
    currentForm,
    setCurrentForm,
    setCurrentLink,
    setResultId,
  } = useFormLoaderStore();

  const { mutate: deleteForm, isPending: deleteFormIsPending } =
    api.form.delete.useMutation({
      onSuccess: async () => {
        setDisplayDeleteAlert(false);

        if (currentForm?.id === id) {
          setCurrentForm(null);
          setCurrentLink(null);
          setResultId(null);
        }

        await utils.form.forms.invalidate();
        sileo.success({ title: t("toast.deleteSuccess") });
      },
      onError: (error) => {
        console.error(error.message);
        sileo.error({ title: t("toast.deleteFailed") });
      },
    });

  return (
    <Card
      onClick={onResults}
      className={cn(
        "bg-muted hover:bg-muted/50 transition-colors h-fit w-full p-3",
        {
          "border-primary": selectedFormId === id,
        },
      )}
    >
      <div className="flex gap-4 flex-col">
        <div className="flex gap-2 flex-col justify-between">
          <div className="flex items-center gap-4 justify-between">
            <p
              className="font-medium text-sm line-clamp-1 text-foreground truncate max-w-60"
              title={title}
            >
              {title}
            </p>
            <Badge variant="outline">{type.toUpperCase()}</Badge>
          </div>
          <span className="text-xs text-muted-foreground">{date}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onOpen({ id, type });
            }}
          >
            {t("button.open")}
          </Button>
          <LinksManager id={id} type={type} />
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto text-red-500"
            onClick={(e) => {
              e.stopPropagation();
              setDisplayDeleteAlert(true);
            }}
          >
            <TrashIcon className="min-w-5 w-5 h-5" />
          </Button>
        </div>
        {/* Stops clicks inside the confirm dialog from reaching the card's onClick. */}
        <div onClick={(e) => e.stopPropagation()}>
          <CustomAlertDialog
            cancelText={t("deleteDialog.cancel")}
            actionText={t("deleteDialog.confirm")}
            title={t("deleteDialog.title")}
            description={t("deleteDialog.description")}
            onCancel={() => {
              setDisplayDeleteAlert(false);
            }}
            onAction={() => {
              deleteForm({ id, type });
            }}
            isPending={deleteFormIsPending}
            open={displayDeleteAlert}
          />
        </div>
      </div>
    </Card>
  );
};
