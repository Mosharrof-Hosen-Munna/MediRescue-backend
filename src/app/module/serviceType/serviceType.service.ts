import { prisma } from "../../lib/prisma";
import type {
	ICreateServiceTypePayload,
	IGetServiceTypesQuery,
} from "./serviceType.interface";

const createServiceType = async (payload: ICreateServiceTypePayload) => {
	const { name, description } = payload;

	// Check if service type already exists
	const existingServiceType = await prisma.serviceType.findUnique({
		where: {
			name,
		},
	});

	if (existingServiceType) {
		throw new Error("Service type already exists");
	}

	// Create service type
	const serviceType = await prisma.serviceType.create({
		data: {
			name,
			description,
		},
	});

	return serviceType;
};

const getAllServiceTypes = async (query: IGetServiceTypesQuery) => {
	const page = Number(query.page) || 1;
	const limit = Number(query.limit) || 10;
	const skip = (page - 1) * limit;

	const where = {
		isActive: true,

		...(query.search && {
			OR: [
				{
					name: {
						contains: query.search,
						mode: "insensitive" as const,
					},
				},
				{
					description: {
						contains: query.search,
						mode: "insensitive" as const,
					},
				},
			],
		}),
	};

	const [serviceTypes, total] = await prisma.$transaction([
		prisma.serviceType.findMany({
			where,
			skip,
			take: limit,
			orderBy: {
				createdAt: "desc",
			},
		}),

		prisma.serviceType.count({
			where,
		}),
	]);

	return {
		data: serviceTypes,
		meta: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
	};
};

export const serviceTypeService = {
	createServiceType,
	getAllServiceTypes,
};
