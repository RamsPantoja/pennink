import type { FC } from "react";
import { Card } from "../../ui/card";
import type { FormType } from "~/lib/enum";
import { LinksManager } from "../../FormEditor/LinksManager";
import type { CurrentForm } from "../useWorkspaceStore";
import { Badge } from "../../ui/badge";
import { Button } from "../../common/Button";
import { LinkIcon } from "@heroicons/react/24/outline";
import { cn } from "~/lib/utils";
import { useTranslations } from "next-intl";

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
        </div>
      </div>
    </Card>
  );
};
