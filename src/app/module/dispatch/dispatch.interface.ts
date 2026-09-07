import type { Prisma } from "../../../generated/prisma/client";

export interface ICreateDispatchPayload {
    emergencyRequestId: string;
    ambulanceId: string;
    driverId: string;
}