import type { Gender, Role } from "../../../generated/prisma/enums";

export interface ILoginUserPayload {
	email: string;
	password: string;
}

export interface IRegisterPatientPayload {
	firstName: string;
	lastName: string;
	phone: string;
	email: string;
	password: string;
}

export interface IRequestUser {
	userId: string;
	email: string;
	firstName?: string;
	lastName?: string;
	role: Role;
}

export interface IRegisterDriverPayload {
	firstName: string;
	lastName: string;
	email: string;
	password: string;
	phone: string;
	dateOfBirth?: Date;
	gender?: Gender;
	address?: string;
	employeeId: string;
	licenseNumber: string;
	licenseExpiryDate: Date;
}
