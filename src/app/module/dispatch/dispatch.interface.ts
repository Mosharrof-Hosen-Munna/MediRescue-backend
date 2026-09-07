import type { DispatchStatus, Prisma } from "../../../generated/prisma/client";

export interface ICreateDispatchPayload {
    emergencyRequestId: string;
    ambulanceId: string;
    driverId: string;
}

export interface IGetDispatchesQuery {
    page?: string;
    limit?: string;
    status?: DispatchStatus;
    driverId?: string;
    ambulanceId?: string;
}

export interface IUpdateDispatchPayload {
    ambulanceId?: string;
    driverId?: string;
}

export type DispatchAction = "accept" | "reject";

export interface IUpdateDispatchActionPayload {
    id: string;
    status: DispatchAction;
    rejectionReason?: string;
}

export interface IGetMyDispatchesQuery {
    page?: string;
    limit?: string;
    status?: DispatchStatus;
}