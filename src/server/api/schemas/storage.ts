import { z } from "zod";

export const createPresignedUrlInputSchema = z.object({
	command: z.enum(["GET", "PUT", "DELETE"]),
	key: z.string().min(1, "Key is required").trim(),
});
