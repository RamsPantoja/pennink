import { useEffect, useState } from "react";
import { DocumentIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";
import { api } from "~/trpc/react";
import type { ChatAttachment } from "~/lib/chatAttachments";
import { cn } from "~/lib/utils";
import { Button } from "../common/Button";

type ChatAttachmentListProps = {
  attachments: ChatAttachment[];
  onRemove?: (key: string) => void;
  className?: string;
};

const AttachmentImage = ({ attachment }: { attachment: ChatAttachment }) => {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const { mutateAsync } = api.storage.createPresignedUrl.useMutation();

  useEffect(() => {
    let active = true;

    mutateAsync({ key: attachment.key, command: "GET" })
      .then((data) => {
        if (active) setSignedUrl(data.signedUrl);
      })
      .catch(console.error);

    return () => {
      active = false;
    };
  }, [attachment.key, mutateAsync]);

  if (!signedUrl) {
    return <div className="size-16 rounded-md bg-muted animate-pulse" />;
  }

  return (
    <img
      src={signedUrl}
      alt={attachment.filename}
      className="size-16 rounded-md object-cover"
    />
  );
};

export const ChatAttachmentList = ({
  attachments,
  onRemove,
  className,
}: ChatAttachmentListProps) => {
  const t = useTranslations("Chat");

  if (attachments.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {attachments.map((attachment) => {
        const isImage = attachment.mediaType.startsWith("image/");

        return (
          <div
            key={attachment.key}
            className="relative flex items-center gap-2 rounded-md border border-border bg-card p-1 pr-2 max-w-full"
          >
            {isImage ? (
              <AttachmentImage attachment={attachment} />
            ) : (
              <DocumentIcon className="size-8 min-w-8 text-foreground" />
            )}
            <div className="flex min-w-0 flex-col">
              <p className="truncate max-w-[180px] text-xs text-foreground">
                {attachment.filename}
              </p>
              <p className="text-xs text-muted-foreground">
                {(attachment.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            {onRemove && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemove(attachment.key)}
                aria-label={t("aria.removeAttachment", {
                  name: attachment.filename,
                })}
              >
                <XMarkIcon className="size-4" />
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
};
