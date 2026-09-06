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