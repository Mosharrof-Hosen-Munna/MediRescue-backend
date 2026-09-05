import { Gender } from "../../../generated/prisma/enums";

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