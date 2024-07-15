import { z } from "zod";
import { educationLevelEnum, genderEnum } from "~/server/db/schema";

export const updateProfileInputSchema = z.object({
    about: z.string({
        required_error: "Required field"
    }).min(1, "Required field"),
    gender: z.enum(genderEnum.enumValues),
    experience: z.string().optional().nullable().transform((value) => {
        if (value?.length === 0) {
            return null
        } else {
            return value;
        }
    }),
    name: z.string({
        required_error: "Required field"
    }).min(1, "Required field"),
    headline: z.string({
        required_error: "Required field"
    }).min(1, "Required field"),
    educationLevel: z.enum(educationLevelEnum.enumValues),
    interests: z.array(z.string().uuid()).min(1, "Least 1 interest"),
    website: z.string().optional().nullable().transform((value) => {
        if (value?.length === 0) {
            return null
        } else {
            return value;
        }
    }),
    username: z.string({
        required_error: "Required field"
    }).min(1, "Required field"),
});

export const buuddyProfileInputSchema = z.object({
    username: z.string({
        required_error: "Required field"
    }).min(1, "Required field"),
});
