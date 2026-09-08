import type {
	DispatchStatus,
	DriverStatus,
	Gender,
} from "../../../generated/prisma/enums";

export interface IGetDriversQuery {
	page?: string;
	limit?: string;
	status?: string;
	search?: string;
}

export interface ICreateDriverPayload {
	firstName: string;
	lastName: string;
	phone: string;
	email: string;
	password: string;
	dateOfBirth?: string;
	gender?: Gender;
	address?: string;
	employeeId: string;
	licenseNumber: string;
	licenseExpiryDate?: string;
}

export interface IGetDriverByIdParams {
	id: string;
}

export interface IUpdateDriverPayload {
	firstName?: string;
	lastName?: string;
	phone?: string;
	dateOfBirth?: string;
	gender?: Gender;
	address?: string;
	employeeId?: string;
	licenseNumber?: string;
	licenseExpiryDate?: string;
}

export interface IUpdateDriverStatusPayload {
	status: DriverStatus;
}

export interface IGetDriverDispatchesQuery {
	page?: string;
	limit?: string;
	status?: DispatchStatus;
}

export interface IGetMyDispatchesQuery {
	page?: string;
	limit?: string;
	status?: DispatchStatus;
}
