import z from "zod";
import { AuditAction } from "../../../generated/prisma/enums";

export const getAuditLogsQuerySchema = z.object({
	query: z.object({
		page: z.coerce.number().int().min(1).default(1),

		limit: z.coerce.number().int().min(1).max(100).default(10),

		action: z.nativeEnum(AuditAction).optional(),

		entity: z.string().trim().optional(),

		userId: z.string().uuid("Invalid user ID").optional(),

		entityId: z.string().uuid("Invalid entity ID").optional(),

		search: z.string().trim().optional(),

		dateFrom: z.coerce.date().optional(),

		dateTo: z.coerce.date().optional(),
	}),
});