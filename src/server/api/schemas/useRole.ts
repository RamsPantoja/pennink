import { z } from "zod";

export const createUserRoleInputSchema = z.object({
    roleId: z.string(),
    description: z.string(),
    hourPrice: z.number()
});