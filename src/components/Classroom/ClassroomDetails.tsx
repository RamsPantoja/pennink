"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { api } from "~/trpc/react";
import CustomAlertDialog from "../common/AlertDialog";
import { Button } from "../common/Button";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { StudyPlansCard } from "../StudyPlan/StudyPlansCard";

export function ClassroomDetails({
  classroomId,
  onDeleted,
}: {
  classroomId: string;
  onDeleted?: () => void;
}) {
  const t = useTranslations("ClassroomDetails");
  const router = useRouter();
  const utils = api.useUtils();
  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [teacherEmail, setTeacherEmail] = useState("");
  const [displayDeleteAlert, setDisplayDeleteAlert] = useState(false);
  const [pendingRemoval, setPendingRemoval] = useState<
    | { type: "student"; id: string; name: string }
    | { type: "teacher"; id: string; name: string }
    | null
  >(null);
  const { data: classroom, isLoading } = api.classroom.classroomById.useQuery({
    id: classroomId,
  });
  const updateName = api.classroom.updateName.useMutation({
    onSuccess: () =>
      utils.classroom.classroomById.invalidate({ id: classroomId }),
  });
  const deleteClassroom = api.classroom.delete.useMutation({
    onSuccess: async () => {
      await utils.classroom.classrooms.invalidate();
      onDeleted?.();
      router.push("/");
    },
    onError: () => setDisplayDeleteAlert(false),
  });
  const createStudent = api.classroom.createStudent.useMutation({
    onSuccess: async () => {
      setStudentName("");
      setStudentEmail("");
      await utils.classroom.classroomById.invalidate({ id: classroomId });
    },
  });
  const addTeacher = api.classroom.addTeacher.useMutation({
    onSuccess: async () => {
      setTeacherEmail("");
      await utils.classroom.classroomById.invalidate({ id: classroomId });
    },
  });
  const removeTeacher = api.classroom.removeTeacher.useMutation({
    onSuccess: async () => {
      setPendingRemoval(null);
      await utils.classroom.classroomById.invalidate({ id: classroomId });
    },
    onError: () => setPendingRemoval(null),
  });
  const deleteStudent = api.classroom.deleteStudent.useMutation({
    onSuccess: async () => {
      setPendingRemoval(null);
      await utils.classroom.classroomById.invalidate({ id: classroomId });
    },
    onError: () => setPendingRemoval(null),
  });

  if (isLoading || !classroom) return <div className="p-6">{t("loading")}</div>;

  return (
    <div className="h-full w-full overflow-auto p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-3xl font-bold">{classroom.name}</p>
            <p className="text-muted-foreground">{t("description")}</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="destructive"
              onClick={() => setDisplayDeleteAlert(true)}
            >
              {t("button.delete")}
            </Button>
          </div>
          <CustomAlertDialog
            title={t("deleteDialog.title")}
            description={t("deleteDialog.description")}
            cancelText={t("deleteDialog.cancel")}
            actionText={t("deleteDialog.confirm")}
            onCancel={() => setDisplayDeleteAlert(false)}
            onAction={() => deleteClassroom.mutate({ id: classroomId })}
            isPending={deleteClassroom.isPending}
            open={displayDeleteAlert}
          />
          <CustomAlertDialog
            title={
              pendingRemoval?.type === "teacher"
                ? t("removeDialog.teacher.title")
                : t("removeDialog.student.title")
            }
            description={
              pendingRemoval?.type === "teacher"
                ? t("removeDialog.teacher.description", {
                    name: pendingRemoval.name,
                  })
                : t("removeDialog.student.description", {
                    name: pendingRemoval?.name ?? "",
                  })
            }
            cancelText={t("deleteDialog.cancel")}
            actionText={t("removeDialog.confirm")}
            onCancel={() => setPendingRemoval(null)}
            onAction={() => {
              if (!pendingRemoval) return;
              if (pendingRemoval.type === "student") {
                deleteStudent.mutate({
                  classroomId,
                  studentId: pendingRemoval.id,
                });
              } else {
                removeTeacher.mutate({ classroomId, userId: pendingRemoval.id });
              }
            }}
            isPending={deleteStudent.isPending || removeTeacher.isPending}
            open={pendingRemoval !== null}
          />
        </div>

        <Card className="gap-3 p-4">
          <p className="font-semibold">{t("name.label")}</p>
          <div className="flex gap-2">
            <Input defaultValue={classroom.name} id="classroom-name" />
            <Button
              onClick={() => {
                const input = document.getElementById(
                  "classroom-name",
                ) as HTMLInputElement;
                updateName.mutate({ id: classroomId, name: input.value });
              }}
            >
              {t("button.rename")}
            </Button>
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="gap-4 p-4">
            <div>
              <p className="font-semibold">{t("students.title")}</p>
              <p className="text-muted-foreground">
                {t("students.description")}
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Input
                value={studentName}
                onChange={(event) => setStudentName(event.target.value)}
                placeholder={t("students.namePlaceholder")}
              />
              <Input
                value={studentEmail}
                onChange={(event) => setStudentEmail(event.target.value)}
                placeholder={t("students.emailPlaceholder")}
                type="email"
              />
            </div>
            <Button
              onClick={() =>
                createStudent.mutate({
                  classroomId,
                  name: studentName,
                  email: studentEmail,
                })
              }
              isPending={createStudent.isPending}
              disabled={!studentName.trim() || !studentEmail.trim()}
            >
              {t("button.addStudent")}
            </Button>
            <div className="space-y-2">
              {classroom.students.map(({ student }) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between rounded border p-2"
                >
                  <div>
                    <p>{student.name}</p>
                    <p className="text-muted-foreground">{student.email}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setPendingRemoval({
                        type: "student",
                        id: student.id,
                        name: student.name,
                      })
                    }
                  >
                    {t("button.remove")}
                  </Button>
                </div>
              ))}
            </div>
          </Card>

          <Card className="gap-4 p-4">
            <div>
              <p className="font-semibold">{t("teachers.title")}</p>
              <p className="text-muted-foreground">
                {t("teachers.description")}
              </p>
            </div>
            <div className="flex gap-2">
              <Input
                value={teacherEmail}
                onChange={(event) => setTeacherEmail(event.target.value)}
                placeholder={t("teachers.emailPlaceholder")}
                type="email"
              />
              <Button
                disabled={!teacherEmail.trim()}
                onClick={() =>
                  addTeacher.mutate({ classroomId, email: teacherEmail })
                }
              >
                {t("button.addTeacher")}
              </Button>
            </div>
            <div className="space-y-2">
              {classroom.teachers.map(({ user }) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between rounded border p-2"
                >
                  <span>{user.email}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={classroom.teachers.length === 1}
                    onClick={() =>
                      setPendingRemoval({
                        type: "teacher",
                        id: user.id,
                        name: user.email,
                      })
                    }
                  >
                    {t("button.remove")}
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <StudyPlansCard classroomId={classroomId} />
      </div>
    </div>
  );
}
