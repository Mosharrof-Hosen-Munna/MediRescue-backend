import { z } from "zod";

export const createEmergencyRequestSchema = z.object({
    serviceTypeId: z
        .string()
        .uuid("Invalid service type ID"),

    ambulanceTypeId: z
        .string()
        .uuid("Invalid ambulance type ID"),

    pickupAddress: z
        .string()
        .min(5, "Pickup address must be at least 5 characters")
        .max(500, "Pickup address must not exceed 500 characters")
        .trim(),

    emergencyDescription: z
        .string()
        .max(1000, "Emergency description must not exceed 1000 characters")
        .trim()
        .optional(),

    patientCondition: z
        .string()
        .max(500, "Patient condition must not exceed 500 characters")
        .trim()
        .optional(),

    additionalNotes: z
        .string()
        .max(1000, "Additional notes must not exceed 1000 characters")
        .trim()
        .optional(),
});