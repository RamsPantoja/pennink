import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";
import type { AgentStatusState } from "./agentStatus";

const DOT_DELAYS = ["0ms", "150ms", "300ms"];

type AgentStatusProps = {
  state: AgentStatusState | null;
};

export const AgentStatus = ({ state }: AgentStatusProps) => {
  const t = useTranslations("Chat.status");

  if (!state) return null;

  if (state === "error") {
    return (
      <output className="flex items-center gap-2 text-sm text-destructive">
        <ExclamationTriangleIcon className="size-4" aria-hidden />
        <span>{t("error")}</span>
      </output>
    );
  }

  return (
    <output className="flex items-center gap-2 text-sm text-muted-foreground">
      <span className="flex items-center gap-1" aria-hidden>
        {DOT_DELAYS.map((delay) => (
          <span
            key={delay}
            className="size-1.5 rounded-full bg-current animate-bounce motion-reduce:animate-none"
            style={{ animationDelay: delay }}
          />
        ))}
      </span>
      <span>{t(state)}</span>
    </output>
  );
};
