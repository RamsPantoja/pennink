import { z } from "zod";

export const updateLocaleInputSchema = z.object({
	locale: z.enum(["en", "es"]),
});
