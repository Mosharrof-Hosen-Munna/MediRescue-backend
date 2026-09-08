import type {
	BloodGroup,
	EmergencyRequestStatus,
	Gender,
} from "../../../generated/prisma/enums";

export interface IUpdateMyPatientProfilePayload {
	firstName?: string;
	lastName?: string;
	phone?: string;
	dateOfBirth?: string;
	gender?: Gender;
	bloodGroup?: BloodGroup;
	emergencyContactName?: string;
	emergencyContactPhone?: string;
	address?: string;
}

export interface IGetPatientEmergencyRequestsQuery {
	page?: string;
	limit?: string;
	status?: EmergencyRequestStatus;
}
