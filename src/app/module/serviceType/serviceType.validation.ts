import { z } from "zod";

export const createServiceTypeSchema = z.object({
    name: z
        .string()
        .min(2, "Service type name must be at least 2 characters")
        .max(100, "Service type name must not exceed 100 characters")
        .trim(),

    description: z
        .string()
        .max(500, "Description must not exceed 500 characters")
        .trim()
        .optional(),
});

export const getServiceTypesQuerySchema = z.object({
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

    search: z
        .string()
        .trim()
        .optional(),
});