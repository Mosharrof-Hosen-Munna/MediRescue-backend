export interface ICreateAmbulanceTypePayload {
    name: string;
    description?: string;
    baseFare: number;
}

export interface IGetAmbulanceTypesQuery {
    page?: string;
    limit?: string;
    search?: string;
    isActive?: string;
}
export interface IUpdateAmbulanceTypePayload {
    name?: string;
    description?: string;
    baseFare?: number;
    isActive?: boolean;
}