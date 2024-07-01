import { z } from "zod";
import { intervalSchema } from "~/components/YourBuuddy/AvailableHours/WeeklyDay/useWeeklyDayLogic";

export const createUserTimesInputSchema = z.object({
    intervals: z.array(intervalSchema).min(1)
});

export const WhereUserTimesInputSchema = z.object({
    userRoleIds: z.array(z.string().uuid()).optional(),
    weeklyDayIds: z.array(z.string().uuid()).optional(),
    userId: z.string().uuid().optional()
})