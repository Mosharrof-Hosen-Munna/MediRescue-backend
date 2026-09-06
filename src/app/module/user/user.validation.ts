import { z } from "zod";
import {
    Role,
    UserStatus,
} from "../../../generated/prisma/enums";

export const updateMyProfileSchema = z.object({
    body: z.object({
        email: z
            .string()
            .trim()
            .toLowerCase()
            .email("Invalid email address")
            .optional(),
    }),
});

export const getUsersQuerySchema = z.object({
    query: z.object({
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

        role: z.nativeEnum(Role).optional(),

        status: z.nativeEnum(UserStatus).optional(),

        search: z
            .string()
            .trim()
            .optional(),
    }),
});