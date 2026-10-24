import type { Message } from "~/server/api/services/chat";
import { Card } from "../ui/card";
import { cn } from "~/lib/utils";
import { ArrowTurnDownRightIcon } from "@heroicons/react/24/outline";
import { Fragment } from "react";
import { useSession } from "next-auth/react";
import { DateTime } from "luxon";
import { Response } from "../ai-elements/response";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "../ai-elements/reasoning";
import { ArtifactCard, type ChatArtifact } from "./ArtifactCard";
import { VoiceOutputButton } from "./VoiceOutputButton";
import { extractSpeechText } from "~/lib/speechText";

type MessageCardProps = {
  message: Message;
  isStreaming?: boolean;
};

export const MessageCard = ({ message, isStreaming }: MessageCardProps) => {
  const { data } = useSession();
  const speechText = extractSpeechText(message.parts) ?? message.content;

  return (
    <div className="flex flex-col w-full">
      {message.quote && (
        <Card className="flex items-start gap-2 border border-border mb-2">
          <ArrowTurnDownRightIcon className="min-w-5 h-5" />
          <p className="text-sm flex-1 italic text-foreground">
            {message.quote}
          </p>
        </Card>
      )}
      <Card
        className={cn([
          "flex flex-col w-full p-3",
          {
            "bg-transparent": message.role === "assistant",
            "bg-border text-foreground relative": message.role === "user",
          },
        ])}
      >
        {message.parts.length > 0 ? (
          <Fragment>
            {message.parts.map((part, i) => {
              switch (part.type) {
                case "text":
                  return (
                    <Response key={`${message.id}-${i}`} content={part.text} />
                  );
                case "reasoning":
                  return (
                    <Reasoning
                      key={`${message.id}-${i}`}
                      className="w-full"
                      isStreaming={isStreaming}
                    >
                      <ReasoningTrigger />
                      <ReasoningContent content={part.text} />
                    </Reasoning>
                  );
                default: {
                  const toolPart = part as unknown as {
                    type?: string;
                    output?: { artifact?: ChatArtifact };
                  };
                  if (
                    toolPart.type === "tool-createArtifact" &&
                    toolPart.output?.artifact
                  ) {
                    return (
                      <ArtifactCard
                        key={`${message.id}-${i}`}
                        artifact={toolPart.output.artifact}
                      />
                    );
                  }
                  return null;
                }
              }
            })}
          </Fragment>
        ) : (
          <Response content={message.content} />
        )}

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {DateTime.fromJSDate(message.createdAt).toLocaleString(
              DateTime.DATETIME_MED,
            )}
          </span>
          {message.role === "assistant" && speechText.trim() && (
            <VoiceOutputButton text={speechText} />
          )}
        </div>
      </Card>
    </div>
  );
};
