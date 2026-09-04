import { z } from "zod";

export const createAmbulanceSchema = z.object({
    registrationNo: z
        .string()
        .min(3, "Registration number must be at least 3 characters")
        .max(30, "Registration number must not exceed 30 characters")
        .trim(),

    model: z
        .string()
        .min(2, "Model must be at least 2 characters")
        .max(100, "Model must not exceed 100 characters")
        .trim(),

    manufacturer: z
        .string()
        .max(100, "Manufacturer must not exceed 100 characters")
        .trim()
        .optional(),

    year: z
        .number()
        .int("Year must be an integer")
        .min(1900, "Invalid manufacturing year")
        .max(new Date().getFullYear(), "Year cannot be in the future")
        .optional(),

    capacity: z
        .number()
        .int("Capacity must be an integer")
        .positive("Capacity must be greater than 0")
        .optional(),

    typeId: z
        .string()
        .uuid("Invalid ambulance type ID"),

    driverId: z
        .string()
        .uuid("Invalid driver ID")
        .optional(),
});