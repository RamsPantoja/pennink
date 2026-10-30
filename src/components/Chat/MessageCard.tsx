import type { Message } from "~/server/api/services/chat";
import { Card } from "../ui/card";
import { cn } from "~/lib/utils";
import { ArrowTurnDownRightIcon } from "@heroicons/react/24/outline";
import { Fragment } from "react";
import { useSession } from "next-auth/react";
import { DateTime } from "luxon";
import { Response } from "../ai-elements/response";
import { ArtifactCard, type ChatArtifact } from "./ArtifactCard";
import { MindMapCard } from "./MindMapCard";
import type { MindMap } from "~/app/agents/chat/mind-map";
import { VoiceOutputButton } from "./VoiceOutputButton";
import { AgentTrace } from "./AgentTrace";
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
          "flex flex-col w-full p-3 ring-0 overflow-visible",
          {
            "bg-transparent": message.role === "assistant",
            "bg-border text-foreground relative": message.role === "user",
          },
        ])}
      >
        {message.role === "assistant" && (
          <AgentTrace parts={message.parts} isStreaming={isStreaming} />
        )}

        {message.parts.length > 0 ? (
          <Fragment>
            {message.parts.map((part, i) => {
              switch (part.type) {
                case "text":
                  return (
                    <Response key={`${message.id}-${i}`} content={part.text} />
                  );
                case "reasoning":
                  return null;
                default: {
                  const toolPart = part as unknown as {
                    type?: string;
                    output?: { artifact?: ChatArtifact; mindMap?: MindMap };
                  };
                  if (
                    toolPart.type === "tool-createMindMap" &&
                    toolPart.output?.mindMap
                  ) {
                    return (
                      <MindMapCard
                        key={`${message.id}-${i}`}
                        mindMap={toolPart.output.mindMap}
                      />
                    );
                  }
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
