export interface ICreateEmergencyRequestPayload {
    serviceTypeId: string;
    ambulanceTypeId: string;
    pickupAddress: string;
    emergencyDescription?: string;
    patientCondition?: string;
    additionalNotes?: string;
}