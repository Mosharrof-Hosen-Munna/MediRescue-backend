import { AuditAction } from "../../../generated/prisma/enums";
import { Prisma } from "../../../generated/prisma/client";

export interface ICreateAuditLogPayload {
	userId?: string;
	action: AuditAction;
	entity: string;
	entityId?: string;
	oldValue?: Prisma.InputJsonValue;
	newValue?: Prisma.InputJsonValue;
	description?: string;
	ipAddress?: string;
	userAgent?: string;
}
