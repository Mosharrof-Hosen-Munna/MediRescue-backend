import { z } from "zod";

export const createDispatchSchema = z.object({
    body: z.object({
        emergencyRequestId: z
            .string()
            .uuid("Invalid emergency request ID"),

        ambulanceId: z
            .string()
            .uuid("Invalid ambulance ID"),

        driverId: z
            .string()
            .uuid("Invalid driver ID"),
    }),
});