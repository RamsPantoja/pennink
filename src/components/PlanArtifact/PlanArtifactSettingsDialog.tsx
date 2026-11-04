"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { api } from "~/trpc/react";
import { Button } from "../common/Button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

export type PlanSettings = {
  id: string;
  title: string;
  range: "day" | "week" | "lesson";
  startDate: string;
  endDate: string;
};

type PlanArtifactSettingsDialogProps = {
  plan: PlanSettings | null;
  onClose: () => void;
};

export function PlanArtifactSettingsDialog({
  plan,
  onClose,
}: PlanArtifactSettingsDialogProps) {
  return (
    <Dialog open={!!plan} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        {plan && (
          <PlanArtifactSettingsForm
            key={plan.id}
            plan={plan}
            onDone={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function PlanArtifactSettingsForm({
  plan,
  onDone,
}: {
  plan: PlanSettings;
  onDone: () => void;
}) {
  const t = useTranslations("PlanArtifact.settings");
  const tPlan = useTranslations("PlanArtifact");
  const utils = api.useUtils();
  const [title, setTitle] = useState(plan.title);
  const [range, setRange] = useState<PlanSettings["range"]>(plan.range);
  const [startDate, setStartDate] = useState(plan.startDate);
  const [endDate, setEndDate] = useState(plan.endDate);
  const [error, setError] = useState<string | null>(null);

  const update = api.planArtifact.update.useMutation({
    onSuccess: () => {
      void utils.planArtifact.listAll.invalidate();
      void utils.planArtifact.byId.invalidate({ id: plan.id });
      onDone();
    },
    onError: (err) => setError(err.message),
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError(t("titleRequired"));
      return;
    }
    if (!startDate || (range === "week" && !endDate)) {
      setError(t("datesRequired"));
      return;
    }
    if (range === "week" && endDate < startDate) {
      setError(t("endBeforeStart"));
      return;
    }

    update.mutate({
      id: plan.id,
      title: trimmedTitle,
      range,
      startDate,
      endDate: range === "day" ? startDate : endDate,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>{t("title")}</DialogTitle>
        <DialogDescription>{t("description")}</DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-2">
        <Label htmlFor="plan-settings-title">{tPlan("titleLabel")}</Label>
        <Input
          id="plan-settings-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder={tPlan("untitled")}
          maxLength={150}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>{t("range")}</Label>
        <Select
          value={range}
          onValueChange={(value) => setRange(value as PlanSettings["range"])}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">{tPlan("range.day")}</SelectItem>
            <SelectItem value="week">{tPlan("range.week")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="plan-settings-start">
            {range === "day" ? t("date") : t("startDate")}
          </Label>
          <Input
            id="plan-settings-start"
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
          />
        </div>
        {range === "week" && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="plan-settings-end">{t("endDate")}</Label>
            <Input
              id="plan-settings-end"
              type="date"
              value={endDate}
              min={startDate}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </div>
        )}
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          {t("cancel")}
        </Button>
        <Button type="submit" isPending={update.isPending}>
          {update.isPending ? t("saving") : t("save")}
        </Button>
      </DialogFooter>
    </form>
  );
}
