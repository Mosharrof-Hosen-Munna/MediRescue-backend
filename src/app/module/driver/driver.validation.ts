import { z } from "zod";
import { DriverStatus } from "../../../generated/prisma/enums";

export const getDriversQuerySchema = z.object({
   query:z.object({
     page: z.coerce
        .number()
        .int()
        .min(1)
        .default(1),

    limit: z.coerce
        .number()
        .int()
        .min(1)
        .max(100)
        .default(10),

    status: z
        .nativeEnum(DriverStatus)
        .optional(),

    search: z
        .string()
        .trim()
        .optional(),
   })
});