import { z } from "zod";

export const createCheckoutSchema = z.object({
	params: z.object({
		dispatchId: z.string().uuid("Invalid dispatch ID"),
	}),
});
