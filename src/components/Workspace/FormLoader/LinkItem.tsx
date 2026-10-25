import { DocumentCheckIcon } from "@heroicons/react/24/outline";
import { DateTime } from "luxon";
import { useMemo } from "react";
import { Button } from "~/components/common/Button";
import ClipBoard from "~/components/common/Clipboard";
import { Badge } from "~/components/ui/badge";
import { Card } from "~/components/ui/card";
import { env } from "~/env";
import type { FormType } from "~/lib/enum";
import { useFormLoaderStore } from "./useFormLoaderStore";
import { useTranslations } from "next-intl";

type LinkItemProps = {
  id: string;
  version: number;
  createdAt: Date;
  classroomName: string;
  type: FormType;
};

export const LinkItem = ({
  id,
  version,
  createdAt,
  classroomName,
  type,
}: LinkItemProps) => {
  const t = useTranslations("FormLoader");
  const { setCurrentLink, setBreadcrumbs, breadcrumbs } = useFormLoaderStore();
  const clipboardContent = useMemo(() => {
    if (type === "BASIC") return `${env.NEXT_PUBLIC_BASE_URL}/form/link/${id}`;
    if (type === "EXAM") return `${env.NEXT_PUBLIC_BASE_URL}/exam/link/${id}`;
    return `${env.NEXT_PUBLIC_BASE_URL}/`;
  }, [id, type]);

  return (
    <Card
      onClick={() => {
        setCurrentLink({ id, link: clipboardContent });
        setBreadcrumbs({ ...breadcrumbs, results: t("breadcrumbs.results") });
      }}
      className="flex gap-2 flex-col bg-muted hover:bg-muted/50 transition-colors h-fit p-3"
    >
      <div className="flex items-center">
        <p
          className="text-xs text-muted-foreground truncate ml-2"
          title={clipboardContent}
        >
          {clipboardContent}
        </p>
        {clipboardContent && (
          <ClipBoard className="rounded-[4px]" content={clipboardContent} />
        )}
      </div>
      <div className="flex gap-4 justify-between items-center">
        <p className="text-xs">
          {classroomName} ·{" "}
          {DateTime.fromJSDate(createdAt).toLocaleString(DateTime.DATETIME_MED)}
        </p>
        <Badge variant="outline">v{version}</Badge>
      </div>
    </Card>
  );
};
