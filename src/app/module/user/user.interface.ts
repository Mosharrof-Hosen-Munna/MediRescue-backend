import { UserStatus } from "../../../generated/prisma/enums";

export interface IUpdateMyProfilePayload {
	email?: string;
}

export interface IGetUsersQuery {
	page?: string;
	limit?: string;
	role?: string;
	status?: string;
	search?: string;
}

export interface IUpdateUserStatusPayload {
	status: UserStatus;
}

export interface IDeleteUserParams {
	id: string;
}
