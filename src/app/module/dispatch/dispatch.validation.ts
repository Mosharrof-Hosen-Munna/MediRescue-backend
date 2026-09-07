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

export const getDispatchesSchema = z.object({
    query: z.object({
        page: z.string().optional(),

        limit: z.string().optional(),

        status: z
            .enum([
                "ASSIGNED",
                "ACCEPTED",
                "REJECTED",
                "EN_ROUTE",
                "ARRIVED",
                "PATIENT_PICKED_UP",
                "AT_HOSPITAL",
                "COMPLETED",
                "CANCELLED",
            ])
            .optional(),

        driverId: z
            .string()
            .uuid("Invalid driver ID")
            .optional(),

        ambulanceId: z
            .string()
            .uuid("Invalid ambulance ID")
            .optional(),
    }),
});

export const getDispatchByIdSchema = z.object({
    params: z.object({
        id: z.string().uuid("Invalid dispatch ID"),
    }),
});

export const updateDispatchSchema = z.object({
    params: z.object({
        id: z.string().uuid("Invalid dispatch ID"),
    }),

    body: z.object({
        ambulanceId: z
            .string()
            .uuid("Invalid ambulance ID")
            .optional(),

        driverId: z
            .string()
            .uuid("Invalid driver ID")
            .optional(),
    }),
});

export const updateDispatchActionSchema = z.object({
    params: z.object({
        id: z.string().uuid("Invalid dispatch ID"),
        status: z.enum(["accept", "reject"], {
            message: "Status must be either accept or reject",
        }),
    }),
    body: z.object({
        rejectionReason: z
            .string()
            .trim()
            .max(
                500,
                "Rejection reason must not exceed 500 characters"
            )
            .optional(),
    }),
});