import { AmbulanceStatus } from "../../../generated/prisma/browser";

export interface ICreateAmbulancePayload {
    registrationNo: string;
    model: string;
    manufacturer?: string;
    year?: number;
    capacity?: number;
    typeId: string;
    driverId?: string;
}

export interface IGetAmbulancesQuery {
    page?: string;
    limit?: string;
    status?: string;
    typeId?: string;
    search?: string;
}

export interface IGetAmbulanceByIdParams {
    id: string;
}

export interface IUpdateAmbulancePayload {
    registrationNo?: string;
    model?: string;
    manufacturer?: string;
    year?: number;
    capacity?: number;
    typeId?: string;
}

export interface IDeleteAmbulanceParams {
    id: string;
}

export interface IUpdateAmbulanceStatusPayload{
    status: AmbulanceStatus;
}

export interface IUpdateAmbulanceDriverPayload {
    driverId?: string | null;
}