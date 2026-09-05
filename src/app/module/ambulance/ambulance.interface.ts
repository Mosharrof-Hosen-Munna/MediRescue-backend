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