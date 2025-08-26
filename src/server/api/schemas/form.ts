import { z } from "zod";
import { aiFormSchema } from "~/lib/schemas/aiForm";

export const createFormSchema = z.object({
	formData: aiFormSchema,
});
