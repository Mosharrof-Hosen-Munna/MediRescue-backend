import { z } from "zod";

export const updateMyPatientProfileSchema = z.object({
    body: z.object({
        firstName: z
            .string()
            .min(2, "First name must be at least 2 characters")
            .max(50, "First name must not exceed 50 characters")
            .trim()
            .optional(),

        lastName: z
            .string()
            .min(2, "Last name must be at least 2 characters")
            .max(50, "Last name must not exceed 50 characters")
            .trim()
            .optional(),

        phone: z
            .string()
            .min(11, "Phone number must be at least 11 characters")
            .max(15, "Phone number must not exceed 15 characters")
            .trim()
            .optional(),

        dateOfBirth: z
            .string()
            .datetime("Invalid date of birth")
            .optional(),

        gender: z
            .enum(["MALE", "FEMALE", "OTHER"])
            .optional(),

        bloodGroup: z
            .enum([
                "A_POSITIVE",
                "A_NEGATIVE",
                "B_POSITIVE",
                "B_NEGATIVE",
                "AB_POSITIVE",
                "AB_NEGATIVE",
                "O_POSITIVE",
                "O_NEGATIVE",
            ])
            .optional(),

        emergencyContactName: z
            .string()
            .min(2, "Emergency contact name must be at least 2 characters")
            .max(100, "Emergency contact name must not exceed 100 characters")
            .trim()
            .optional(),

        emergencyContactPhone: z
            .string()
            .min(11, "Emergency contact phone must be at least 11 characters")
            .max(15, "Emergency contact phone must not exceed 15 characters")
            .trim()
            .optional(),

        address: z
            .string()
            .max(500, "Address must not exceed 500 characters")
            .trim()
            .optional(),
    }),
});

export const getPatientEmergencyRequestsSchema = z.object({
    params: z.object({
        id: z.string().uuid("Invalid patient ID"),
    }),
    query: z.object({
        page: z.string().optional(),
        limit: z.string().optional(),
        status: z
            .enum([
                "PENDING",
                "ACCEPTED",
                "DISPATCHED",
                "IN_PROGRESS",
                "COMPLETED",
                "CANCELLED",
                "REJECTED",
                "NO_AMBULANCE_AVAILABLE",
            ])
            .optional(),
    }),
});