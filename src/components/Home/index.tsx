"use client";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { typeid } from "typeid-js";
import { api } from "~/trpc/react";
import { Chat } from "../Chat";
import { ClassroomPicker } from "../Classroom/ClassroomPicker";
import { CreateClassroomForm } from "../Classroom/CreateClassroomForm";
import { Card } from "../ui/card";
import { Skeleton } from "../ui/skeleton";

export const HomeComponent = () => {
  const t = useTranslations("HomePage");
  const memoChatId = useMemo(() => {
    return typeid().toUUID();
  }, []);
  const { data: classrooms, isLoading: classroomsIsLoading } =
    api.classroom.classrooms.useQuery();
  const needsClassroom = !!classrooms && classrooms.length === 0;

  return (
    <div className="flex w-full pl-4 pr-4 pt-0 pb-4 h-full justify-center items-center">
      <Card className="border-none max-w-(--breakpoint-lg) gap-4 flex flex-col w-full justify-center h-full bg-transparent ring-0">
        {classroomsIsLoading ? (
          <Card className="w-full max-w-md mx-auto gap-4 p-6 rounded-xl border border-border bg-popover shadow-lg ring-0">
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-9 w-full rounded-md" />
          </Card>
        ) : needsClassroom ? (
          <Card className="w-full max-w-md mx-auto gap-4 p-6 rounded-xl border border-border bg-popover text-popover-foreground shadow-lg ring-0">
            <div className="flex flex-col gap-1">
              <p className="text-lg font-semibold">
                {t("createClassroom.title")}
              </p>
              <p className="text-sm text-muted-foreground">
                {t("createClassroom.description")}
              </p>
            </div>
            <CreateClassroomForm />
          </Card>
        ) : (
          <>
            <ClassroomPicker />
            <Chat id={memoChatId} isNew={true} />
          </>
        )}
      </Card>
    </div>
  );
};
