export interface ICreateServiceTypePayload {
	name: string;
	description?: string;
}

export interface IGetServiceTypesQuery {
	page?: string;
	limit?: string;
	search?: string;
}
