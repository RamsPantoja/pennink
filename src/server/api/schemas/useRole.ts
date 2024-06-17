import { z } from "zod";

const detailSchema = z.object({
    id: z.string({
        required_error: "Campo requerido"
    }).uuid("Not allowed"),
    allowed: z.boolean({
        required_error: "Campo requerido",
        invalid_type_error: "Campo requerido",
    }),
    description: z.string({
        required_error: "Campo requerido"
    }).min(1, "Campo requerido"),
});

export const createUserRoleInputSchema = z.object({
    roleId: z.string(),
    description: z.string(),
    hourPrice: z.number(),
    details: z.array(detailSchema).min(1)
});