import { z } from "zod";
import {
	weekDaysEnum,
	genderEnum,
	educationLevelEnum,
	bookingRequestStatusEnum,
	paymentTypeEnum,
} from "~/server/db/schema";

const weeklyDays = z.enum(weekDaysEnum.enumValues);
export type WeeklyDays = z.infer<typeof weeklyDays>;

const genders = z.enum(genderEnum.enumValues);
export type Genders = z.infer<typeof genders>;

const educationLevel = z.enum(educationLevelEnum.enumValues);
export type EducationLevel = z.infer<typeof educationLevel>;

const bookingRequestStatus = z.enum(bookingRequestStatusEnum.enumValues);
export type BookingRequestStatus = z.infer<typeof bookingRequestStatus>;

const paymentType = z.enum(paymentTypeEnum.enumValues);
export type PaymentType = z.infer<typeof paymentType>;
