import {
  ArrowTurnDownRightIcon,
  PaperClipIcon,
  PlusIcon,
  StopIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

import { Button } from "../common/Button";
import { Card } from "../ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { ArrowUpIcon } from "lucide-react";
import { CHAT_ATTACHMENT_ACCEPT } from "~/lib/chatAttachments";
import { ChatAttachmentList } from "./ChatAttachments";
import { parseUIMessage, useChatLogic } from "./useChatLogic";
import { MessageCard } from "./MessageCard";
import { AgentStatus } from "./AgentStatus";
import { getAgentStatus } from "./agentStatus";
import { ChatSkeleton } from "./ChatSkeleton";
import FeedbackMessage from "../common/FeedbackMessage";
import { cn } from "~/lib/utils";
import { ScrollToBottomButton } from "../common/ScrollToBottomButton";
import { AutoResizeTextarea } from "../common/AutoSizeTextarea";
import { Controller } from "react-hook-form";
import { Separator } from "../ui/separator";
import { BrainIcon } from "lucide-react";
import {
  Fragment,
  type ClipboardEvent,
  type KeyboardEvent,
  useRef,
} from "react";
import { useTranslations } from "next-intl";
import { VoiceInputButton } from "./VoiceInputButton";

type ChatProps = {
  id: string;
  isNew: boolean;
};

export const Chat = ({ id, isNew }: ChatProps) => {
  const t = useTranslations("Chat");

  const {
    onSentPrompt,
    hasClassroom,
    useChatForm,
    tempMessages,
    messages,
    createWorkspaceIsPending,
    messagesIsLoading,
    messagesIsError,
    chatContainer,
    quote,
    onRemoveQuote,
    documentVectorSearchMutationIsPending,
    stopStreaming,
    handleKeyDown,
    triggerChatMessagesRuleIsPending,
    status,
    attachments,
    onAddFiles,
    onRemoveAttachment,
    isUploadingAttachments,
    answerAskUser,
  } = useChatLogic({ chatId: id, isNew });

  const agentStatus = getAgentStatus({
    status,
    isSearching:
      documentVectorSearchMutationIsPending || triggerChatMessagesRuleIsPending,
    lastMessageParts: (tempMessages.at(-1) ?? messages.at(-1))?.parts,
  });

  const { handleSubmit, watch, control } = useChatForm;
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const openFilePicker = () => fileInputRef.current?.click();

  const handleInputKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "u") {
      event.preventDefault();
      openFilePicker();
      return;
    }

    handleKeyDown(event);
  };

  const handleInputPaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
    const images = Array.from(event.clipboardData.items)
      .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
      .map((item) => item.getAsFile())
      .filter((file): file is File => file !== null);

    if (images.length === 0) return;

    event.preventDefault();
    void onAddFiles(images);
  };

  console.log(messages);

  return (
    <Card
      className={cn([
        "flex flex-col gap-4 overflow-hidden p-0 relative w-full rounded-none bg-transparent ring-0",
        {
          "flex-1": messages.length > 0,
        },
      ])}
    >
      {messagesIsLoading && <ChatSkeleton />}
      {!messagesIsLoading && messagesIsError && (
        <FeedbackMessage status="ERROR" message={t("errors.fetchMessages")} />
      )}
      <div className="flex flex-1 overflow-hidden relative">
        <div
          ref={chatContainer}
          className="flex flex-col gap-4 overflow-auto p-4 flex-1 relative"
          id="chat-container"
        >
          {messages.length === 0 && !isNew && (
            <Card className="flex flex-col gap-2 items-center justify-center flex-1 bg-transparent">
              <BrainIcon className="min-w-16 h-16 animate-pulse" />
              <p className="font-bold">{t("emptyState.title")}</p>
              <p className="text-sm">{t("emptyState.description")}</p>
            </Card>
          )}
          {messages.length > 0 &&
            messages.map((message) => (
              <MessageCard
                key={message.id}
                message={message}
                onAskUserAnswer={answerAskUser}
              />
            ))}
          {tempMessages.map((message) => {
            const parsedMessage = parseUIMessage(message);
            if (parsedMessage) {
              return (
                <div key={message.id} className="flex flex-1 min-h-96">
                  <MessageCard
                    isStreaming={status === "streaming"}
                    message={parsedMessage}
                    onAskUserAnswer={answerAskUser}
                  />
                </div>
              );
            }
            return <Fragment key={message.id} />;
          })}
          <AgentStatus state={agentStatus} />
        </div>
        <ScrollToBottomButton scrollableElementId="chat-container" />
      </div>
      <div className="flex flex-col gap-2 p-3">
        <Card className="w-full bg-background border border-border rounded-2xl flex flex-col p-3 shadow-xs shadow-border">
          {quote && (
            <Card className="flex items-start gap-2 bg-muted border">
              <ArrowTurnDownRightIcon className="min-w-5 h-5 text-foreground" />
              <p className="text-foreground text-xs flex-1">{quote}</p>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onRemoveQuote}
                    aria-label={t("aria.removeQuote")}
                  >
                    <XCircleIcon className="min-w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("tooltips.removeQuote")}</TooltipContent>
              </Tooltip>
            </Card>
          )}
          {(attachments.length > 0 || isUploadingAttachments) && (
            <ChatAttachmentList
              attachments={attachments}
              onRemove={onRemoveAttachment}
              className="mb-2"
            />
          )}
          <Controller
            control={control}
            name="prompt"
            render={({ field }) => (
              <AutoResizeTextarea
                placeholder={t("input.placeholder")}
                className="border-none ring-0 text-foreground bg-background"
                onChange={field.onChange}
                value={field.value}
                onKeyDown={handleInputKeyDown}
                onPaste={handleInputPaste}
                aria-label={t("aria.chatInput")}
              />
            )}
          />
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={CHAT_ATTACHMENT_ACCEPT}
            className="hidden"
            data-testid="chat-attachment-input"
            onChange={(event) => {
              const files = Array.from(event.target.files ?? []);
              event.target.value = "";
              void onAddFiles(files);
            }}
          />
          <div className="flex w-full gap-4 justify-between items-end">
            <div className="flex min-w-0 flex-1 items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={isUploadingAttachments}
                    aria-label={t("aria.addAttachment")}
                  >
                    <PlusIcon className="min-w-5 w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" side="top" className="w-fit">
                  <DropdownMenuItem onSelect={openFilePicker}>
                    <PaperClipIcon className="size-4" />
                    {t("attachments.addFilesOrPhotos")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <VoiceInputButton
                onTranscript={(transcript) =>
                  onSentPrompt({ prompt: transcript })
                }
              />
            </div>
            {(status === "submitted" ||
              documentVectorSearchMutationIsPending ||
              status === "streaming" ||
              triggerChatMessagesRuleIsPending) && (
              <Button
                variant="teal"
                onClick={stopStreaming}
                size="icon"
                disabled={false}
                aria-label={t("aria.stopStreaming")}
              >
                <StopIcon className="min-w-5 w-5 h-5" />
              </Button>
            )}
            {!(
              status === "submitted" ||
              documentVectorSearchMutationIsPending ||
              status === "streaming" ||
              triggerChatMessagesRuleIsPending
            ) && (
              <Button
                onClick={handleSubmit(onSentPrompt)}
                size="icon"
                variant="teal"
                disabled={
                  !hasClassroom ||
                  createWorkspaceIsPending ||
                  triggerChatMessagesRuleIsPending ||
                  isUploadingAttachments ||
                  (!watch("prompt").trim() && attachments.length === 0)
                }
                aria-label={t("aria.sendMessage")}
              >
                <ArrowUpIcon className="min-w-5 w-5 h-5" />
              </Button>
            )}
          </div>
        </Card>
      </div>
    </Card>
  );
};
