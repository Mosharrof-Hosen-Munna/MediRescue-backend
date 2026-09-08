import type { AmbulanceStatus } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { auditLogService } from "../auditLog/auditLog.service";
import type {
	ICreateAmbulancePayload,
	IGetAmbulancesQuery,
	IUpdateAmbulancePayload,
} from "./ambulance.interface";

const createAmbulance = async (payload: ICreateAmbulancePayload) => {
	const {
		registrationNo,
		model,
		manufacturer,
		year,
		capacity,
		typeId,
		driverId,
	} = payload;

	const existingAmbulance = await prisma.ambulance.findUnique({
		where: {
			registrationNo,
		},
	});

	if (existingAmbulance) {
		throw new Error("Ambulance with this registration number already exists");
	}

	const ambulanceType = await prisma.ambulanceType.findUnique({
		where: {
			id: typeId,
		},
	});

	if (!ambulanceType) {
		throw new Error("Ambulance type not found");
	}

	if (!ambulanceType.isActive) {
		throw new Error("Ambulance type is not active");
	}

	if (driverId) {
		const driver = await prisma.driver.findUnique({
			where: {
				id: driverId,
			},
		});

		if (!driver) {
			throw new Error("Driver not found");
		}

		if (driver.status !== "AVAILABLE") {
			throw new Error("Driver is not available");
		}

		const driverHasAmbulance = await prisma.ambulance.findUnique({
			where: {
				driverId,
			},
		});

		if (driverHasAmbulance) {
			throw new Error("This driver is already assigned to an ambulance");
		}
	}

	const ambulance = await prisma.ambulance.create({
		data: {
			registrationNo,
			model,
			manufacturer,
			year,
			capacity,
			typeId,
			driverId,
		},
		include: {
			type: true,
			driver: {
				select: {
					id: true,
					firstName: true,
					lastName: true,
					phone: true,
					employeeId: true,
					licenseNumber: true,
					status: true,
				},
			},
		},
	});

	return ambulance;
};

const getAllAmbulances = async (query: IGetAmbulancesQuery) => {
	const page = Number(query.page) || 1;
	const limit = Number(query.limit) || 10;
	const skip = (page - 1) * limit;

	const where = {
		...(query.status && {
			status: query.status as any,
		}),
		// isDeleted:false,
		...(query.typeId && {
			typeId: query.typeId,
		}),

		...(query.search && {
			OR: [
				{
					registrationNo: {
						contains: query.search,
						mode: "insensitive" as const,
					},
				},
				{
					model: {
						contains: query.search,
						mode: "insensitive" as const,
					},
				},
				{
					manufacturer: {
						contains: query.search,
						mode: "insensitive" as const,
					},
				},
			],
		}),
	};

	const [ambulances, total] = await prisma.$transaction([
		prisma.ambulance.findMany({
			where,
			skip,
			take: limit,

			orderBy: {
				createdAt: "desc",
			},

			include: {
				type: {
					select: {
						id: true,
						name: true,
						description: true,
						baseFare: true,
						isActive: true,
					},
				},

				driver: {
					select: {
						id: true,
						firstName: true,
						lastName: true,
						phone: true,
						employeeId: true,
						licenseNumber: true,
						status: true,
					},
				},
			},
		}),

		prisma.ambulance.count({
			where,
		}),
	]);

	return {
		data: ambulances,

		meta: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
	};
};

const getAmbulanceById = async (id: string) => {
	const ambulance = await prisma.ambulance.findUnique({
		where: {
			id,
			isDeleted: false,
		},
		include: {
			type: {
				select: {
					id: true,
					name: true,
					description: true,
					baseFare: true,
					isActive: true,
				},
			},
			driver: {
				select: {
					id: true,
					firstName: true,
					lastName: true,
					phone: true,
					employeeId: true,
					licenseNumber: true,
					licenseExpiryDate: true,
					status: true,
				},
			},
		},
	});

	if (!ambulance) {
		throw new Error("Ambulance not found");
	}

	return ambulance;
};

const updateAmbulance = async (
	id: string,
	payload: IUpdateAmbulancePayload,
	adminUserId: string,
) => {
	const ambulance = await prisma.ambulance.findUnique({
		where: {
			id,
		},
	});

	if (!ambulance) {
		throw new Error("Ambulance not found");
	}

	// Check registration number if it is being changed
	if (
		payload.registrationNo &&
		payload.registrationNo !== ambulance.registrationNo
	) {
		const existingAmbulance = await prisma.ambulance.findUnique({
			where: {
				registrationNo: payload.registrationNo,
			},
		});

		if (existingAmbulance) {
			throw new Error("Ambulance with this registration number already exists");
		}
	}

	// Check ambulance type if it is being changed
	if (payload.typeId && payload.typeId !== ambulance.typeId) {
		const ambulanceType = await prisma.ambulanceType.findUnique({
			where: {
				id: payload.typeId,
			},
		});

		if (!ambulanceType) {
			throw new Error("Ambulance type not found");
		}

		if (!ambulanceType.isActive) {
			throw new Error("Ambulance type is not active");
		}
	}

	const oldValue = {
		registrationNo: ambulance.registrationNo,
		model: ambulance.model,
		manufacturer: ambulance.manufacturer,
		year: ambulance.year,
		capacity: ambulance.capacity,
		typeId: ambulance.typeId,
	};

	const updatedAmbulance = await prisma.$transaction(async (tx) => {
		const updatedAmbulance = await tx.ambulance.update({
			where: {
				id,
			},
			data: {
				registrationNo: payload.registrationNo,
				model: payload.model,
				manufacturer: payload.manufacturer,
				year: payload.year,
				capacity: payload.capacity,
				typeId: payload.typeId,
			},
			include: {
				type: true,
				driver: {
					select: {
						id: true,
						firstName: true,
						lastName: true,
						phone: true,
						employeeId: true,
						licenseNumber: true,
						status: true,
					},
				},
			},
		});

		await auditLogService.createAuditLog(tx, {
			userId: adminUserId,
			action: "UPDATE",
			entity: "AMBULANCE",
			entityId: updatedAmbulance.id,
			oldValue,
			newValue: {
				registrationNo: updatedAmbulance.registrationNo,
				model: updatedAmbulance.model,
				manufacturer: updatedAmbulance.manufacturer,
				year: updatedAmbulance.year,
				capacity: updatedAmbulance.capacity,
				typeId: updatedAmbulance.typeId,
			},
			description: "Ambulance information updated",
		});
		return updatedAmbulance;
	});

	return updatedAmbulance;
};

const deleteAmbulance = async (id: string, adminUserId: string) => {
	const ambulance = await prisma.ambulance.findUnique({
		where: {
			id,
		},
	});

	if (!ambulance) {
		throw new Error("Ambulance not found");
	}

	if (ambulance.isDeleted) {
		throw new Error("Ambulance is already deleted");
	}

	// Don't allow deletion while ambulance is active
	if (ambulance.status === "ASSIGNED" || ambulance.status === "ON_TRIP") {
		throw new Error(
			"Cannot delete an ambulance that is currently assigned or on a trip",
		);
	}

	const deletedAmbulance = await prisma.$transaction(async (tx) => {
		const deletedAmbulance = await tx.ambulance.update({
			where: {
				id,
			},
			data: {
				isDeleted: true,
				deletedAt: new Date(),
			},
			include: {
				type: true,
				driver: {
					select: {
						id: true,
						firstName: true,
						lastName: true,
						phone: true,
						employeeId: true,
						status: true,
					},
				},
			},
		});

		await auditLogService.createAuditLog(tx, {
			userId: adminUserId,
			action: "SOFT_DELETE",
			entity: "AMBULANCE",
			entityId: deletedAmbulance.id,
			oldValue: {
				isDeleted: ambulance.isDeleted,
				deletedAt: ambulance.deletedAt,
				status: ambulance.status,
				registrationNo: ambulance.registrationNo,
			},
			newValue: {
				isDeleted: true,
				deletedAt: deletedAmbulance.deletedAt,
			},
			description: "Ambulance soft deleted",
		});

		return deletedAmbulance;
	});

	return deletedAmbulance;
};

const updateAmbulanceStatus = async (
	userId: string,
	ambulanceId: string,
	status: AmbulanceStatus,
) => {
	console.log(userId, ambulanceId, status);
	const ambulance = await prisma.ambulance.findUnique({
		where: {
			id: ambulanceId,
			isDeleted: false,
		},
	});
	if (!ambulance) {
		throw new Error("Ambulance not found");
	}

	const result = await prisma.$transaction(async (tx) => {
		const updatedAmbulance = await tx.ambulance.update({
			where: {
				id: ambulanceId,
			},
			data: {
				status: status,
			},
			include: {
				type: true,
				driver: {
					select: {
						id: true,
						firstName: true,
						lastName: true,
						phone: true,
						employeeId: true,
						licenseNumber: true,
						status: true,
					},
				},
			},
		});

		await auditLogService.createAuditLog(tx, {
			userId: userId,
			action: "STATUS_CHANGE",
			entity: "AMBULANCE",
			entityId: updatedAmbulance.id,
			oldValue: {
				status: ambulance.status,
			},
			newValue: {
				status: updatedAmbulance.status,
			},
			description: `Ambulance status changed from ${ambulance.status} to ${updatedAmbulance.status}`,
		});

		return updatedAmbulance;
	});

	return result;
};
const updateAmbulanceDriver = async (
	id: string,
	driverId: string | null | undefined,
	adminUserId: string,
) => {
	const ambulance = await prisma.ambulance.findUnique({
		where: {
			id,
		},
		include: {
			type: true,
			driver: {
				select: {
					id: true,
					firstName: true,
					lastName: true,
					phone: true,
					employeeId: true,
					status: true,
				},
			},
		},
	});

	if (!ambulance) {
		throw new Error("Ambulance not found");
	}

	if (ambulance.isDeleted) {
		throw new Error("Cannot assign driver to a deleted ambulance");
	}

	if (ambulance.status === "ON_TRIP" || ambulance.status === "ASSIGNED") {
		throw new Error(
			"Cannot change driver while ambulance is assigned or on a trip",
		);
	}

	if (driverId === ambulance.driverId) {
		throw new Error(
			driverId
				? "This driver is already assigned to the ambulance"
				: "No driver is currently assigned to this ambulance",
		);
	}

	let driver;

	if (driverId) {
		driver = await prisma.driver.findUnique({
			where: {
				id: driverId,
			},
			select: {
				id: true,
				firstName: true,
				lastName: true,
				phone: true,
				employeeId: true,
				status: true,
				ambulance: {
					select: {
						id: true,
						registrationNo: true,
					},
				},
			},
		});

		if (!driver) {
			throw new Error("Driver not found");
		}

		if (driver.status !== "AVAILABLE") {
			throw new Error("Driver is not available for assignment");
		}

		if (driver.ambulance) {
			throw new Error("Driver is already assigned to another ambulance");
		}
	}

	const result = await prisma.$transaction(async (tx) => {
		const updatedAmbulance = await tx.ambulance.update({
			where: {
				id,
			},
			data: {
				driverId: driverId ?? null,
			},
			include: {
				type: true,
				driver: {
					select: {
						id: true,
						firstName: true,
						lastName: true,
						phone: true,
						employeeId: true,
						licenseNumber: true,
						status: true,
					},
				},
			},
		});

		await auditLogService.createAuditLog(tx, {
			userId: adminUserId,
			action: "UPDATE",
			entity: "AMBULANCE",
			entityId: updatedAmbulance.id,
			oldValue: {
				driverId: ambulance.driverId,
				driver: ambulance.driver
					? {
							id: ambulance.driver.id,
							name: `${ambulance.driver.firstName} ${ambulance.driver.lastName}`,
							employeeId: ambulance.driver.employeeId,
						}
					: null,
			},
			newValue: {
				driverId: updatedAmbulance.driverId,
				driver: updatedAmbulance.driver
					? {
							id: updatedAmbulance.driver.id,
							name: `${updatedAmbulance.driver.firstName} ${updatedAmbulance.driver.lastName}`,
							employeeId: updatedAmbulance.driver.employeeId,
						}
					: null,
			},
			description: driverId
				? "Driver assigned to ambulance"
				: "Driver removed from ambulance",
		});

		return updatedAmbulance;
	});

	return result;
};

export const ambulanceService = {
	createAmbulance,
	getAllAmbulances,
	getAmbulanceById,
	updateAmbulance,
	deleteAmbulance,
	updateAmbulanceStatus,
	updateAmbulanceDriver,
};
