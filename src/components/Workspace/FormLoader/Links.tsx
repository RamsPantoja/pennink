import { Card } from "~/components/ui/card";
import type { FormType } from "~/lib/enum";
import { Loading } from "~/components/common/Loading";
import FeedbackMessage from "~/components/common/FeedbackMessage";
import { LinkItem } from "./LinkItem";
import { useLinksLogic } from "./useLinksLogic";
import { useTranslations } from "next-intl";

type LinksProps = {
  id: string;
  type: FormType;
};

export const Links = ({ id, type }: LinksProps) => {
  const t = useTranslations("Links");
  const { linksData, linksIsPending, linksError } = useLinksLogic({ id, type });

  return (
    <Card className="flex h-full w-full ring-0">
      <div className="flex flex-col gap-4 w-full">
        {linksIsPending && <Loading />}
        {!linksIsPending && linksError && (
          <FeedbackMessage status="ERROR" message={linksError.message} />
        )}
        {!linksIsPending &&
          !linksError &&
          linksData &&
          linksData.links.length > 0 && (
            <div className="grid grid-cols-2 gap-3 w-full overflow-auto">
              {linksData.type === "BASIC" &&
                linksData.links.map((link) => (
                  <LinkItem
                    key={link.id}
                    id={link.id}
                    version={link.formVersion.version}
                    createdAt={link.createdAt}
                    classroomName={link.classroom.name}
                    type={linksData.type}
                  />
                ))}
              {linksData.type === "EXAM" &&
                linksData.links.map((link) => (
                  <LinkItem
                    key={link.id}
                    id={link.id}
                    version={link.examVersion.version}
                    createdAt={link.createdAt}
                    classroomName={link.classroom.name}
                    type={linksData.type}
                  />
                ))}
            </div>
          )}
        {!linksIsPending &&
          !linksError &&
          linksData &&
          linksData.links.length === 0 && (
            <FeedbackMessage
              status="INFORMATION"
              message={t("message.noLinks")}
            />
          )}
      </div>
    </Card>
  );
};
