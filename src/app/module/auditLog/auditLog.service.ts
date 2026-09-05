import { Prisma } from "../../../generated/prisma/client";
import { ICreateAuditLogPayload } from "./auditLog.interface";

const createAuditLog = async (
    tx: Prisma.TransactionClient,
    payload: ICreateAuditLogPayload
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

export const auditLogService = {
    createAuditLog,
};