import { z } from "zod";
import { weekDaysEnum } from "~/server/db/schema";

const weeklyDays = z.enum(weekDaysEnum.enumValues);
export type WeeklyDays = z.infer<typeof weeklyDays>;