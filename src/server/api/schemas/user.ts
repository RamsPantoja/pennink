import { z } from "zod";

export const buuddyModeUserInputSchema = z.object({
    isActive: z.boolean()
});

export const getUserByIdInputSchema = z.object({
    id: z.string().uuid()
});

export const buuddiesInputSchema = z.object({
    interests: z.array(z.string().uuid()),
    name: z.string().trim().optional()
})