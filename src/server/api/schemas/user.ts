import { z } from "zod";

export const buuddyModeUserInputSchema = z.object({
    isActive: z.boolean()
});

export const getUserByIdInputSchema = z.object({
    id: z.string().uuid()
});