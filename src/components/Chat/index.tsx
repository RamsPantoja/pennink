import {
  ArrowTurnDownRightIcon,
  DocumentTextIcon,
  PlusIcon,
  StopIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { Button } from "../common/Button";
import { Card } from "../ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { ArrowUpIcon } from "lucide-react";
import { parseUIMessage, useChatLogic } from "./useChatLogic";
import { MessageCard } from "./MessageCard";
import { ChatSkeleton } from "./ChatSkeleton";
import FeedbackMessage from "../common/FeedbackMessage";
import { cn } from "~/lib/utils";
import { ScrollToBottomButton } from "../common/ScrollToBottomButton";
import { AutoResizeTextarea } from "../common/AutoSizeTextarea";
import { Controller } from "react-hook-form";
import { Separator } from "../ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { BrainIcon } from "lucide-react";
import { Fragment } from "react";
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
    document,
    documentVectorSearchMutationIsPending,
    stopStreaming,
    handleKeyDown,
    triggerChatMessagesRuleIsPending,
    aiContextItems,
    setAiContextItems,
    status,
  } = useChatLogic({ chatId: id, isNew });

  const { handleSubmit, watch, control } = useChatForm;

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
              <MessageCard key={message.id} message={message} />
            ))}
          {tempMessages.map((message) => {
            const parsedMessage = parseUIMessage(message);
            if (parsedMessage) {
              return (
                <div key={message.id} className="flex flex-1 min-h-96">
                  <MessageCard
                    isStreaming={status === "streaming"}
                    message={parsedMessage}
                  />
                </div>
              );
            }
            return <Fragment key={message.id} />;
          })}
        </div>
        <ScrollToBottomButton scrollableElementId="chat-container" />
      </div>
      <div className="flex flex-col gap-2 p-3">
        {!isNew && (
          <div className="flex items-center gap-2 w-full flex-wrap">
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger
                    asChild
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    className="h-8 min-w-8 w-fit inline-flex gap-2 items-center justify-center whitespace-nowrap rounded-md"
                  >
                    <Button
                      variant="outline"
                      onClick={stopStreaming}
                      size="icon"
                      disabled={false}
                      aria-label={t("aria.addContext")}
                    >
                      <PlusIcon className="min-w-5 w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>{t("tooltips.addContext")}</TooltipContent>
              </Tooltip>
              <DropdownMenuContent
                side="right"
                onCloseAutoFocus={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <DropdownMenuItem
                  onClick={(e) => {
                    if (
                      !aiContextItems.find((item) => item.type === "document")
                    ) {
                      setAiContextItems([
                        ...aiContextItems,
                        {
                          label: t("contextItems.document"),
                          type: "document",
                        },
                      ]);
                    }
                  }}
                  disabled={!document}
                  className="flex gap-2"
                >
                  <DocumentTextIcon className="min-w-5 w-5 h-5" />
                  {t("contextItems.document")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {aiContextItems.length === 0 && (
              <span className="text-xs text-muted-foreground">
                {t("contextItems.addPrompt")}
              </span>
            )}
            {aiContextItems.length >= 1 &&
              aiContextItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-1 border border-border rounded-md pl-2 max-w-40"
                >
                  {item.type === "document" && (
                    <DocumentTextIcon className="min-w-5 w-5 h-5" />
                  )}
                  <p
                    className="text-muted-foreground text-xs truncate"
                    title={item.label}
                  >
                    {item.label}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setAiContextItems(
                        aiContextItems.filter((_, i) => i !== index),
                      );
                    }}
                    aria-label={t("aria.removeContextItem", {
                      item: item.label,
                    })}
                  >
                    <XCircleIcon className="min-w-5 h-5" />
                  </Button>
                </div>
              ))}
          </div>
        )}
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
          <Controller
            control={control}
            name="prompt"
            render={({ field }) => (
              <AutoResizeTextarea
                placeholder={t("input.placeholder")}
                className="border-none ring-0 text-foreground bg-background"
                onChange={field.onChange}
                value={field.value}
                onKeyDown={handleKeyDown}
                aria-label={t("aria.chatInput")}
              />
            )}
          />
          <div className="flex w-full gap-4 justify-between items-end">
            <div className="flex items-center gap-4">
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
                  !watch("prompt").trim()
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
