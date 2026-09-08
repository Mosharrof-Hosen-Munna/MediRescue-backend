import { prisma } from "../../lib/prisma";
import { auditLogService } from "../auditLog/auditLog.service";
import {
	ICreateAmbulanceTypePayload,
	IGetAmbulanceTypesQuery,
	IUpdateAmbulanceTypePayload,
} from "./ambulanceType.interface";

const createAmbulanceType = async (payload: ICreateAmbulanceTypePayload) => {
	const { name, description, baseFare } = payload;

	// Check if ambulance type already exists
	const existingAmbulanceType = await prisma.ambulanceType.findUnique({
		where: {
			name,
		},
	});

	if (existingAmbulanceType) {
		throw new Error("Ambulance type already exists");
	}

	// Create ambulance type
	const ambulanceType = await prisma.ambulanceType.create({
		data: {
			name,
			description,
			baseFare,
		},
	});

	return ambulanceType;
};

const getAmbulanceTypes = async (query: IGetAmbulanceTypesQuery) => {
	const page = Number(query.page) || 1;
	const limit = Number(query.limit) || 10;
	const skip = (page - 1) * limit;

	const where = {
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

		...(query.isActive !== undefined && {
			isActive: query.isActive === "true",
		}),
	};

	const [data, total] = await Promise.all([
		prisma.ambulanceType.findMany({
			where,
			skip,
			take: limit,
			orderBy: {
				createdAt: "desc",
			},
			select: {
				id: true,
				name: true,
				description: true,
				baseFare: true,
				isActive: true,
				createdAt: true,
				updatedAt: true,
			},
		}),

		prisma.ambulanceType.count({
			where,
		}),
	]);

	return {
		data,
		meta: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
	};
};

const getAmbulanceTypeById = async (id: string) => {
	const ambulanceType = await prisma.ambulanceType.findUnique({
		where: {
			id,
		},
		select: {
			id: true,
			name: true,
			description: true,
			baseFare: true,
			isActive: true,
			createdAt: true,
			updatedAt: true,

			ambulances: {
				where: {
					isDeleted: false,
				},
				select: {
					id: true,
					registrationNo: true,
					model: true,
					manufacturer: true,
					year: true,
					capacity: true,
					status: true,
				},
			},
		},
	});

	if (!ambulanceType) {
		throw new Error("Ambulance type not found");
	}

	return ambulanceType;
};

const updateAmbulanceType = async (
	id: string,
	payload: IUpdateAmbulanceTypePayload,
	adminUserId: string,
) => {
	const ambulanceType = await prisma.ambulanceType.findUnique({
		where: {
			id,
		},
	});

	if (!ambulanceType) {
		throw new Error("Ambulance type not found");
	}

	if (payload.name && payload.name !== ambulanceType.name) {
		const existingType = await prisma.ambulanceType.findUnique({
			where: {
				name: payload.name,
			},
		});

		if (existingType) {
			throw new Error("Ambulance type with this name already exists");
		}
	}

	const oldValue = {
		name: ambulanceType.name,
		description: ambulanceType.description,
		baseFare: ambulanceType.baseFare,
		isActive: ambulanceType.isActive,
	};

	const result = await prisma.$transaction(async (tx) => {
		const updatedAmbulanceType = await tx.ambulanceType.update({
			where: {
				id,
			},
			data: {
				...(payload.name !== undefined && {
					name: payload.name,
				}),
				...(payload.description !== undefined && {
					description: payload.description,
				}),
				...(payload.baseFare !== undefined && {
					baseFare: payload.baseFare,
				}),
				...(payload.isActive !== undefined && {
					isActive: payload.isActive,
				}),
			},
			select: {
				id: true,
				name: true,
				description: true,
				baseFare: true,
				isActive: true,
				createdAt: true,
				updatedAt: true,
			},
		});

		await auditLogService.createAuditLog(tx, {
			userId: adminUserId,
			action: "UPDATE",
			entity: "AMBULANCE_TYPE",
			entityId: updatedAmbulanceType.id,
			oldValue,
			newValue: {
				name: updatedAmbulanceType.name,
				description: updatedAmbulanceType.description,
				baseFare: updatedAmbulanceType.baseFare,
				isActive: updatedAmbulanceType.isActive,
			},
			description: "Ambulance type updated",
		});

		return updatedAmbulanceType;
	});

	return result;
};

const deleteAmbulanceType = async (id: string, adminUserId: string) => {
	const ambulanceType = await prisma.ambulanceType.findUnique({
		where: {
			id,
		},
		include: {
			ambulances: {
				select: {
					id: true,
				},
			},
		},
	});

	if (!ambulanceType) {
		throw new Error("Ambulance type not found");
	}

	if (ambulanceType.ambulances.length > 0) {
		throw new Error(
			"Cannot delete an ambulance type that is assigned to ambulances",
		);
	}

	const result = await prisma.$transaction(async (tx) => {
		const deletedAmbulanceType = await tx.ambulanceType.delete({
			where: {
				id,
			},
			select: {
				id: true,
				name: true,
				description: true,
				baseFare: true,
				isActive: true,
				createdAt: true,
				updatedAt: true,
			},
		});

		await auditLogService.createAuditLog(tx, {
			userId: adminUserId,
			action: "DELETE",
			entity: "AMBULANCE_TYPE",
			entityId: deletedAmbulanceType.id,
			oldValue: {
				name: ambulanceType.name,
				description: ambulanceType.description,
				baseFare: ambulanceType.baseFare,
				isActive: ambulanceType.isActive,
			},
			description: "Ambulance type deleted",
		});

		return deletedAmbulanceType;
	});

	return result;
};

export const ambulanceTypeService = {
	createAmbulanceType,
	getAmbulanceTypes,
	getAmbulanceTypeById,
	updateAmbulanceType,
	deleteAmbulanceType,
};
