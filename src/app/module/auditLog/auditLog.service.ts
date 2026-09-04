import { prisma } from "../../lib/prisma";
import { ICreateAuditLogPayload } from "./auditLog.interface";

const createAuditLog = async (
    payload: ICreateAuditLogPayload
) => {
    const auditLog = await prisma.auditLog.create({
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

    return auditLog;
};

export const auditLogService = {
    createAuditLog,
};