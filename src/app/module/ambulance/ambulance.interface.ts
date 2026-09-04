export interface ICreateAmbulancePayload {
    registrationNo: string;
    model: string;
    manufacturer?: string;
    year?: number;
    capacity?: number;
    typeId: string;
    driverId?: string;
}