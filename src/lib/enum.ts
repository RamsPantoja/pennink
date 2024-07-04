import { z } from "zod";
import { weekDaysEnum, genderEnum, educationLevelEnum } from "~/server/db/schema";

const weeklyDays = z.enum(weekDaysEnum.enumValues);
export type WeeklyDays = z.infer<typeof weeklyDays>;

const genders = z.enum(genderEnum.enumValues);
export type Genders = z.infer<typeof genders>;

const educationLevel = z.enum(educationLevelEnum.enumValues);
export type EducationLevel = z.infer<typeof educationLevel>;