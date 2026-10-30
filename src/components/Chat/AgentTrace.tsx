import { useState } from "react";
import { useTranslations } from "next-intl";
import type { MyUIMessage } from "./useChatLogic";
import { Response } from "../ai-elements/response";
import {
  Trace,
  TraceCollapsible,
  TraceCollapsibleContent,
  TraceCollapsibleTrigger,
  TraceDescription,
  TraceLine,
  TraceTitle,
} from "../ui/trace";

type MessagePart = MyUIMessage["parts"][number];

type ToolPart = {
  type: string;
  state?: string;
  input?: unknown;
  output?: unknown;
  errorText?: string;
};

type ReasoningPart = {
  type: "reasoning";
  text: string;
  state?: string;
};

type AgentTraceProps = {
  parts: MessagePart[];
  isStreaming?: boolean;
};

const HIDDEN_TOOLS = ["tool-prepareSpeechText", "tool-createArtifact"];

const LABELED_TOOLS = [
  "generateAndEditForm",
  "shareClassroomLink",
  "manageStudyPlan",
  "listClassroomStudents",
  "createMindMap",
];

const isReasoningPart = (
  part: MessagePart,
): part is MessagePart & ReasoningPart => part.type === "reasoning";

const isToolPart = (part: MessagePart) =>
  part.type.startsWith("tool-") && !HIDDEN_TOOLS.includes(part.type);

const getToolStatus = (part: ToolPart) => {
  if (part.state === "output-error") return "error";
  if (part.state === "output-available") return undefined;
  return "running";
};

const formatJson = (value: unknown) => {
  if (value === undefined) return "";

  const json = JSON.stringify(value, null, 2) ?? "";

  return json.length > 1500 ? `${json.slice(0, 1500)}…` : json;
};

export const AgentTrace = ({ parts, isStreaming = false }: AgentTraceProps) => {
  const t = useTranslations("Chat.trace");
  // Open while streaming so steps are visible as they happen; the user's own
  // toggle wins once they touch it. After streaming it defaults to collapsed.
  const [userOpen, setUserOpen] = useState<boolean | null>(null);
  const open = userOpen ?? isStreaming;
  const steps = parts.filter(
    (part) => isReasoningPart(part) || isToolPart(part),
  );

  if (steps.length === 0) return null;

  return (
    <TraceCollapsible
      className="mb-2"
      open={open}
      onOpenChange={setUserOpen}
    >
      <TraceCollapsibleTrigger>
        <span className="text-xs">{t("summary", { count: steps.length })}</span>
      </TraceCollapsibleTrigger>
      <TraceCollapsibleContent>
        <Trace>
          {steps.map((part, i) => {
            if (isReasoningPart(part)) {
              return (
                <TraceCollapsible key={`reasoning-${i}`}>
                  <TraceCollapsibleTrigger>
                    <TraceLine
                      status={
                        part.state === "streaming" ? "running" : undefined
                      }
                    >
                      <TraceTitle>{t("thinking")}</TraceTitle>
                    </TraceLine>
                  </TraceCollapsibleTrigger>
                  <TraceCollapsibleContent>
                    <Response content={part.text} />
                  </TraceCollapsibleContent>
                </TraceCollapsible>
              );
            }

            const toolPart = part as unknown as ToolPart;
            const name = toolPart.type.replace(/^tool-/, "");
            const labelKey = LABELED_TOOLS.includes(name) ? name : "unknown";

            return (
              <TraceCollapsible key={`${toolPart.type}-${i}`}>
                <TraceCollapsibleTrigger>
                  <TraceLine status={getToolStatus(toolPart)}>
                    <TraceTitle>{t(`tools.${labelKey}`)}</TraceTitle>
                  </TraceLine>
                </TraceCollapsibleTrigger>
                <TraceCollapsibleContent>
                  <div className="flex flex-col gap-1">
                    {toolPart.input !== undefined && (
                      <TraceDescription className="text-xs">
                        {t("input")}
                      </TraceDescription>
                    )}
                    <pre className="overflow-x-auto text-xs whitespace-pre-wrap">
                      {formatJson(toolPart.input)}
                    </pre>
                    {toolPart.output !== undefined && (
                      <TraceDescription className="text-xs">
                        {t("output")}
                      </TraceDescription>
                    )}
                    <pre className="overflow-x-auto text-xs whitespace-pre-wrap">
                      {formatJson(toolPart.output)}
                    </pre>
                    {toolPart.errorText && (
                      <p className="text-xs text-destructive">
                        {toolPart.errorText}
                      </p>
                    )}
                  </div>
                </TraceCollapsibleContent>
              </TraceCollapsible>
            );
          })}
        </Trace>
      </TraceCollapsibleContent>
    </TraceCollapsible>
  );
};
