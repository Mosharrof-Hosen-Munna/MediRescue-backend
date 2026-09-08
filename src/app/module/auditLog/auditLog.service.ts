import type { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import type { ICreateAuditLogPayload, IGetAuditLogsQuery } from "./auditLog.interface";

const createAuditLog = async (
	tx: Prisma.TransactionClient,
	payload: ICreateAuditLogPayload,
) => {
	return tx.auditLog.create({
		data: {
			userId: payload.userId,
			action: payload.action,
			entity: payload.entity,
			entityId: payload.entityId,
			oldValue: payload.oldValue,
			newValue: payload.newValue,
			description: payload.description,
			ipAddress: payload.ipAddress,
			userAgent: payload.userAgent,
		},
	});
};

const getAllAuditLogs = async (query: IGetAuditLogsQuery) => {
	const page = Number(query.page) || 1;
	const limit = Number(query.limit) || 10;
	const skip = (page - 1) * limit;

	const where = {
		...(query.action && {
			action: query.action,
		}),

		...(query.entity && {
			entity: {
				contains: query.entity,
				mode: "insensitive" as const,
			},
		}),

		...(query.userId && {
			userId: query.userId,
		}),

		...(query.entityId && {
			entityId: query.entityId,
		}),

		...(query.dateFrom || query.dateTo
			? {
					createdAt: {
						...(query.dateFrom && {
							gte: query.dateFrom,
						}),
						...(query.dateTo && {
							lte: query.dateTo,
						}),
					},
				}
			: {}),

		...(query.search && {
			OR: [
				{
					entity: {
						contains: query.search,
						mode: "insensitive" as const,
					},
				},
				{
					entityId: {
						contains: query.search,
						mode: "insensitive" as const,
					},
				},
				{
					description: {
						contains: query.search,
						mode: "insensitive" as const,
					},
				},
			],
		}),
	};

	const [auditLogs, total] = await prisma.$transaction([
		prisma.auditLog.findMany({
			where,
			skip,
			take: limit,

			orderBy: {
				createdAt: "desc",
			},

			include: {
				user: {
					select: {
						id: true,
						email: true,
						role: true,
					},
				},
			},
		}),

		prisma.auditLog.count({
			where,
		}),
	]);

	return {
		data: auditLogs,
		meta: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
	};
};

export const auditLogService = {
	createAuditLog,
	getAllAuditLogs,
};
