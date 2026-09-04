export interface ICreateEmergencyRequestPayload {
    serviceTypeId: string;
    ambulanceTypeId: string;
    pickupAddress: string;
    emergencyDescription?: string;
    patientCondition?: string;
    additionalNotes?: string;
}

export interface IGetEmergencyRequestsQuery {
    page?: string;
    limit?: string;
    status?: string;
    search?: string;
}

export interface IGetEmergencyRequestByIdParams {
    id: string;
}