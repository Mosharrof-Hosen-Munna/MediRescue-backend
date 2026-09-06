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

export const createDriverSchema = z.object({
    body: z.object({
        firstName: z
            .string()
            .min(2, "First name must be at least 2 characters")
            .max(50, "First name must not exceed 50 characters")
            .trim(),

        lastName: z
            .string()
            .min(2, "Last name must be at least 2 characters")
            .max(50, "Last name must not exceed 50 characters")
            .trim(),

        phone: z
            .string()
            .min(11, "Phone number must be at least 11 characters")
            .max(15, "Phone number must not exceed 15 characters")
            .trim(),

        email: z
            .string()
            .email("Invalid email address")
            .trim()
            .toLowerCase(),

        password: z
            .string()
            .min(8, "Password must be at least 8 characters")
            .max(100, "Password must not exceed 100 characters"),

        dateOfBirth: z
            .string()
            .datetime("Invalid date of birth")
            .optional(),

        gender: z
            .enum(["MALE", "FEMALE", "OTHER"])
            .optional(),

        address: z
            .string()
            .max(500, "Address must not exceed 500 characters")
            .trim()
            .optional(),

        employeeId: z
            .string()
            .min(2, "Employee ID must be at least 2 characters")
            .max(50, "Employee ID must not exceed 50 characters")
            .trim(),

        licenseNumber: z
            .string()
            .min(3, "License number must be at least 3 characters")
            .max(50, "License number must not exceed 50 characters")
            .trim(),

        licenseExpiryDate: z
            .string()
            .datetime("Invalid license expiry date")
            .optional(),
    }),
});

export const getDriverByIdSchema = z.object({
    params: z.object({
        id: z.string().uuid("Invalid driver ID"),
    }),
});


export const updateDriverSchema = z.object({
    params: z.object({
        id: z.string().uuid("Invalid driver ID"),
    }),
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

        address: z
            .string()
            .max(500, "Address must not exceed 500 characters")
            .trim()
            .optional(),

        employeeId: z
            .string()
            .min(2, "Employee ID must be at least 2 characters")
            .max(50, "Employee ID must not exceed 50 characters")
            .trim()
            .optional(),

        licenseNumber: z
            .string()
            .min(2, "License number must be at least 2 characters")
            .max(50, "License number must not exceed 50 characters")
            .trim()
            .optional(),

        licenseExpiryDate: z
            .string()
            .datetime("Invalid license expiry date")
            .optional(),
    }),
});

export const updateDriverStatusSchema = z.object({
    params: z.object({
        id: z.string().uuid("Invalid driver ID"),
    }),
    body: z.object({
        status: z.enum([
            "AVAILABLE",
            "OFF_DUTY",
            "BUSY",
            "SUSPENDED",
        ]),
    }),
});

export const deleteDriverSchema = z.object({
    params: z.object({
        id: z.string().uuid("Invalid driver ID"),
    }),
});