import { z } from "zod";
import { intervalSchema } from "~/components/YourBuuddy/AvailableHours/WeeklyDay/useWeeklyDayLogic";

export const createUserTimesInputSchema = z.object({
    intervals: z.array(intervalSchema).min(1)
});