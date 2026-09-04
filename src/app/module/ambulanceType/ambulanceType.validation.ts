import { z } from "zod";

export const createAmbulanceTypeSchema = z.object({
    name: z
        .string()
        .min(2, "Ambulance type name must be at least 2 characters")
        .max(100, "Ambulance type name must not exceed 100 characters")
        .trim(),

    description: z
        .string()
        .max(500, "Description must not exceed 500 characters")
        .trim()
        .optional(),

    baseFare: z
        .number()
        .positive("Base fare must be greater than 0"),
});