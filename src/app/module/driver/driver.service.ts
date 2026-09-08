import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma";
import type {
	ICreateDriverPayload,
	IGetDriverDispatchesQuery,
	IGetDriversQuery,
	IGetMyDispatchesQuery,
	IUpdateDriverPayload,
	IUpdateDriverStatusPayload,
} from "./driver.interface";
import { auditLogService } from "../auditLog/auditLog.service";

const getAllDrivers = async (query: IGetDriversQuery) => {
	const page = Number(query.page) || 1;
	const limit = Number(query.limit) || 10;
	const skip = (page - 1) * limit;

	const where = {
		...(query.status && {
			status: query.status as any,
		}),

		...(query.search && {
			OR: [
				{
					firstName: {
						contains: query.search,
						mode: "insensitive" as const,
					},
				},
				{
					lastName: {
						contains: query.search,
						mode: "insensitive" as const,
					},
				},
				{
					phone: {
						contains: query.search,
						mode: "insensitive" as const,
					},
				},
				{
					employeeId: {
						contains: query.search,
						mode: "insensitive" as const,
					},
				},
				{
					licenseNumber: {
						contains: query.search,
						mode: "insensitive" as const,
					},
				},
			],
		}),
	};

	const [drivers, total] = await prisma.$transaction([
		prisma.driver.findMany({
			where,
			skip,
			take: limit,

			orderBy: {
				createdAt: "desc",
			},

			include: {
				user: {
					select: {
						id: true,
						email: true,
						emailVerified: true,
						status: true,
					},
				},

				ambulance: {
					select: {
						id: true,
						registrationNo: true,
						model: true,
						status: true,

						type: {
							select: {
								id: true,
								name: true,
							},
						},
					},
				},
			},
		}),

		prisma.driver.count({
			where,
		}),
	]);

	return {
		data: drivers,

		meta: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
	};
};

const createDriver = async (
	payload: ICreateDriverPayload,
	adminUserId: string,
) => {
	const {
		firstName,
		lastName,
		phone,
		email,
		password,
		dateOfBirth,
		gender,
		address,
		employeeId,
		licenseNumber,
		licenseExpiryDate,
	} = payload;

	// Check email
	const existingUser = await prisma.user.findUnique({
		where: {
			email,
		},
	});

	if (existingUser) {
		throw new Error("User with this email already exists");
	}

	// Check employee ID
	const existingEmployee = await prisma.driver.findUnique({
		where: {
			employeeId,
		},
	});

	if (existingEmployee) {
		throw new Error("Driver with this employee ID already exists");
	}

	// Check license number
	const existingLicense = await prisma.driver.findUnique({
		where: {
			licenseNumber,
		},
	});

	if (existingLicense) {
		throw new Error("Driver with this license number already exists");
	}

	// Check phone
	const existingPhone = await prisma.driver.findFirst({
		where: {
			phone,
		},
	});

	if (existingPhone) {
		throw new Error("Driver with this phone number already exists");
	}

	const hashedPassword = await bcrypt.hash(password, 12);

	const result = await prisma.$transaction(async (tx) => {
		// Create User
		const user = await tx.user.create({
			data: {
				email,
				password: hashedPassword,
				role: "DRIVER",
				status: "ACTIVE",
				emailVerified: false,
				needPasswordChange: true,
			},
		});

		// Create Driver
		const driver = await tx.driver.create({
			data: {
				userId: user.id,
				firstName,
				lastName,
				phone,
				dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
				gender,
				address,
				employeeId,
				licenseNumber,
				licenseExpiryDate: licenseExpiryDate
					? new Date(licenseExpiryDate)
					: undefined,
				status: "AVAILABLE",
			},
			include: {
				user: {
					select: {
						id: true,
						email: true,
						role: true,
						status: true,
						emailVerified: true,
						needPasswordChange: true,
					},
				},
			},
		});
		// Create audit log
		await auditLogService.createAuditLog(tx, {
			userId: adminUserId,
			action: "CREATE",
			entity: "DRIVER",
			entityId: result.id,
			newValue: {
				userId: result.userId,
				firstName: result.firstName,
				lastName: result.lastName,
				phone: result.phone,
				email: result.user.email,
				employeeId: result.employeeId,
				licenseNumber: result.licenseNumber,
				status: result.status,
			},
			description: "Driver created successfully",
		});

		return driver;
	});

	return result;
};

const getDriverById = async (id: string, userId: string, userRole: string) => {
	const driver = await prisma.driver.findUnique({
		where: {
			id,
		},
		include: {
			user: {
				select: {
					id: true,
					email: true,
					role: true,
					status: true,
					emailVerified: true,
					needPasswordChange: true,
					createdAt: true,
				},
			},
			ambulance: {
				include: {
					type: true,
				},
			},
			dispatches: true,
		},
	});

	if (!driver) {
		throw new Error("Driver not found");
	}

	if (userRole === "DRIVER" && driver.userId !== userId) {
		throw new Error("You are not allowed to view this driver");
	}

	return driver;
};

const updateDriver = async (
	id: string,
	payload: IUpdateDriverPayload,
	adminUserId: string,
) => {
	const driver = await prisma.driver.findUnique({
		where: {
			id,
		},
	});

	if (!driver) {
		throw new Error("Driver not found");
	}

	if (driver.isDeleted) {
		throw new Error("Driver profile is deleted");
	}

	if (payload.employeeId && payload.employeeId !== driver.employeeId) {
		const existingEmployee = await prisma.driver.findUnique({
			where: {
				employeeId: payload.employeeId,
			},
		});

		if (existingEmployee) {
			throw new Error("Employee ID already exists");
		}
	}

	if (payload.licenseNumber && payload.licenseNumber !== driver.licenseNumber) {
		const existingLicense = await prisma.driver.findUnique({
			where: {
				licenseNumber: payload.licenseNumber,
			},
		});

		if (existingLicense) {
			throw new Error("License number already exists");
		}
	}

	const oldValue = {
		firstName: driver.firstName,
		lastName: driver.lastName,
		phone: driver.phone,
		dateOfBirth: driver.dateOfBirth,
		gender: driver.gender,
		address: driver.address,
		employeeId: driver.employeeId,
		licenseNumber: driver.licenseNumber,
		licenseExpiryDate: driver.licenseExpiryDate,
	};

	const result = await prisma.$transaction(async (tx) => {
		const updatedDriver = await tx.driver.update({
			where: {
				id,
			},
			data: {
				...(payload.firstName !== undefined && {
					firstName: payload.firstName,
				}),
				...(payload.lastName !== undefined && {
					lastName: payload.lastName,
				}),
				...(payload.phone !== undefined && {
					phone: payload.phone,
				}),
				...(payload.dateOfBirth !== undefined && {
					dateOfBirth: new Date(payload.dateOfBirth),
				}),
				...(payload.gender !== undefined && {
					gender: payload.gender,
				}),
				...(payload.address !== undefined && {
					address: payload.address,
				}),
				...(payload.employeeId !== undefined && {
					employeeId: payload.employeeId,
				}),
				...(payload.licenseNumber !== undefined && {
					licenseNumber: payload.licenseNumber,
				}),
				...(payload.licenseExpiryDate !== undefined && {
					licenseExpiryDate: new Date(payload.licenseExpiryDate),
				}),
			},
			select: {
				id: true,
				userId: true,
				firstName: true,
				lastName: true,
				phone: true,
				dateOfBirth: true,
				gender: true,
				address: true,
				employeeId: true,
				licenseNumber: true,
				licenseExpiryDate: true,
				status: true,
				isDeleted: true,
				createdAt: true,
				updatedAt: true,
			},
		});

		await auditLogService.createAuditLog(tx, {
			userId: adminUserId,
			action: "UPDATE",
			entity: "DRIVER",
			entityId: updatedDriver.id,
			oldValue,
			newValue: {
				firstName: updatedDriver.firstName,
				lastName: updatedDriver.lastName,
				phone: updatedDriver.phone,
				dateOfBirth: updatedDriver.dateOfBirth,
				gender: updatedDriver.gender,
				address: updatedDriver.address,
				employeeId: updatedDriver.employeeId,
				licenseNumber: updatedDriver.licenseNumber,
				licenseExpiryDate: updatedDriver.licenseExpiryDate,
			},
			description: "Driver profile updated",
		});

		return updatedDriver;
	});

	return result;
};

const updateDriverStatus = async (
	id: string,
	payload: IUpdateDriverStatusPayload,
	adminUserId: string,
) => {
	const driver = await prisma.driver.findUnique({
		where: {
			id,
		},
		include: {
			ambulance: true,
		},
	});

	if (!driver) {
		throw new Error("Driver not found");
	}

	if (driver.isDeleted) {
		throw new Error("Driver profile is deleted");
	}

	if (driver.status === payload.status) {
		throw new Error("Driver is already in this status");
	}

	if (payload.status === "OFF_DUTY" && driver.ambulance) {
		throw new Error(
			"Cannot set driver off duty while assigned to an ambulance",
		);
	}

	if (payload.status === "OFF_DUTY" && driver.status === "BUSY") {
		throw new Error("Cannot set a busy driver off duty");
	}

	const oldValue = {
		status: driver.status,
	};

	const result = await prisma.$transaction(async (tx) => {
		const updatedDriver = await tx.driver.update({
			where: {
				id,
			},
			data: {
				status: payload.status,
			},
			select: {
				id: true,
				firstName: true,
				lastName: true,
				phone: true,
				employeeId: true,
				status: true,
				isDeleted: true,
				updatedAt: true,
			},
		});

		await auditLogService.createAuditLog(tx, {
			userId: adminUserId,
			action: "STATUS_CHANGE",
			entity: "DRIVER",
			entityId: updatedDriver.id,
			oldValue,
			newValue: {
				status: updatedDriver.status,
			},
			description: "Driver status changed",
		});

		return updatedDriver;
	});

	return result;
};

const deleteDriver = async (id: string, adminUserId: string) => {
	const driver = await prisma.driver.findUnique({
		where: {
			id,
		},
		include: {
			ambulance: {
				select: {
					id: true,
					registrationNo: true,
				},
			},
			dispatches: {
				where: {
					status: {
						in: [
							"ASSIGNED",
							"ACCEPTED",
							"EN_ROUTE",
							"ARRIVED",
							"PATIENT_PICKED_UP",
							"AT_HOSPITAL",
						],
					},
				},
				select: {
					id: true,
					status: true,
				},
			},
		},
	});

	if (!driver) {
		throw new Error("Driver not found");
	}

	if (driver.isDeleted) {
		throw new Error("Driver is already deleted");
	}

	if (driver.ambulance) {
		throw new Error("Cannot delete a driver who is assigned to an ambulance");
	}

	if (driver.dispatches.length > 0) {
		throw new Error("Cannot delete a driver with an active dispatch");
	}

	const deletedAt = new Date();

	const result = await prisma.$transaction(async (tx) => {
		const deletedDriver = await tx.driver.update({
			where: {
				id,
			},
			data: {
				isDeleted: true,
				deletedAt,
				status: "OFF_DUTY",
			},
			select: {
				id: true,
				userId: true,
				firstName: true,
				lastName: true,
				phone: true,
				employeeId: true,
				licenseNumber: true,
				status: true,
				isDeleted: true,
				deletedAt: true,
				updatedAt: true,
			},
		});

		await auditLogService.createAuditLog(tx, {
			userId: adminUserId,
			action: "SOFT_DELETE",
			entity: "DRIVER",
			entityId: deletedDriver.id,
			oldValue: {
				firstName: driver.firstName,
				lastName: driver.lastName,
				phone: driver.phone,
				employeeId: driver.employeeId,
				licenseNumber: driver.licenseNumber,
				status: driver.status,
				isDeleted: driver.isDeleted,
				deletedAt: driver.deletedAt,
			},
			newValue: {
				firstName: deletedDriver.firstName,
				lastName: deletedDriver.lastName,
				phone: deletedDriver.phone,
				employeeId: deletedDriver.employeeId,
				licenseNumber: deletedDriver.licenseNumber,
				status: deletedDriver.status,
				isDeleted: deletedDriver.isDeleted,
				deletedAt: deletedDriver.deletedAt,
			},
			description: "Driver soft deleted",
		});

		return deletedDriver;
	});

	return result;
};

const getDriverDispatches = async (
	driverId: string,
	query: IGetDriverDispatchesQuery,
) => {
	const page = Number(query.page) || 1;
	const limit = Number(query.limit) || 10;
	const skip = (page - 1) * limit;

	const driver = await prisma.driver.findUnique({
		where: {
			id: driverId,
		},
		select: {
			id: true,
			firstName: true,
			lastName: true,
			employeeId: true,
			isDeleted: true,
		},
	});

	if (!driver) {
		throw new Error("Driver not found");
	}

	if (driver.isDeleted) {
		throw new Error("Driver profile is deleted");
	}

	const where = {
		driverId,
		...(query.status && {
			status: query.status,
		}),
	};

	const [data, total] = await Promise.all([
		prisma.dispatch.findMany({
			where,
			skip,
			take: limit,
			orderBy: {
				assignedAt: "desc",
			},
			select: {
				id: true,
				status: true,
				assignedAt: true,
				acceptedAt: true,
				arrivedAt: true,
				pickedUpAt: true,
				hospitalArrivedAt: true,
				completedAt: true,
				cancelledAt: true,
				cancellationReason: true,
				createdAt: true,
				updatedAt: true,

				emergencyRequest: {
					select: {
						id: true,
						requestNumber: true,
						pickupAddress: true,
						emergencyDescription: true,
						patientCondition: true,
						status: true,
						requestedAt: true,

						patient: {
							select: {
								id: true,
								firstName: true,
								lastName: true,
								phone: true,
							},
						},

						serviceType: {
							select: {
								id: true,
								name: true,
							},
						},

						ambulanceType: {
							select: {
								id: true,
								name: true,
							},
						},
					},
				},

				ambulance: {
					select: {
						id: true,
						registrationNo: true,
						model: true,
						manufacturer: true,
						status: true,
					},
				},
			},
		}),

		prisma.dispatch.count({
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

const getMyProfile = async (userId: string) => {
	const driver = await prisma.driver.findUnique({
		where: {
			userId,
		},
		include: {
			user: {
				select: {
					id: true,
					email: true,
					emailVerified: true,
					role: true,
					status: true,
					needPasswordChange: true,
					isDeleted: true,
					createdAt: true,
					updatedAt: true,
				},
			},
			ambulance: {
				select: {
					id: true,
					registrationNo: true,
					model: true,
					manufacturer: true,
					year: true,
					capacity: true,
					status: true,
					type: {
						select: {
							id: true,
							name: true,
							description: true,
							baseFare: true,
						},
					},
				},
			},
		},
	});

	if (!driver) {
		throw new Error("Driver profile not found");
	}

	if (driver.isDeleted || driver.user.isDeleted) {
		throw new Error("Driver profile is deleted");
	}

	return driver;
};

const getMyDispatches = async (
	userId: string,
	query: IGetMyDispatchesQuery,
) => {
	const page = Number(query.page) || 1;
	const limit = Number(query.limit) || 10;
	const skip = (page - 1) * limit;

	const driver = await prisma.driver.findUnique({
		where: {
			userId,
		},
		select: {
			id: true,
			isDeleted: true,
		},
	});

	if (!driver) {
		throw new Error("Driver profile not found");
	}

	if (driver.isDeleted) {
		throw new Error("Driver profile is deleted");
	}

	const where = {
		driverId: driver.id,
		...(query.status && {
			status: query.status,
		}),
	};

	const [data, total] = await Promise.all([
		prisma.dispatch.findMany({
			where,
			skip,
			take: limit,
			orderBy: {
				assignedAt: "desc",
			},
			select: {
				id: true,
				status: true,
				assignedAt: true,
				acceptedAt: true,
				arrivedAt: true,
				pickedUpAt: true,
				hospitalArrivedAt: true,
				completedAt: true,
				cancelledAt: true,
				cancellationReason: true,
				createdAt: true,
				updatedAt: true,

				emergencyRequest: {
					select: {
						id: true,
						requestNumber: true,
						pickupAddress: true,
						emergencyDescription: true,
						patientCondition: true,
						additionalNotes: true,
						status: true,
						requestedAt: true,

						patient: {
							select: {
								id: true,
								firstName: true,
								lastName: true,
								phone: true,
							},
						},

						serviceType: {
							select: {
								id: true,
								name: true,
								description: true,
							},
						},

						ambulanceType: {
							select: {
								id: true,
								name: true,
								description: true,
							},
						},
					},
				},

				ambulance: {
					select: {
						id: true,
						registrationNo: true,
						model: true,
						manufacturer: true,
						status: true,
					},
				},
			},
		}),

		prisma.dispatch.count({
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

export const driverService = {
	getAllDrivers,
	createDriver,
	getDriverById,
	deleteDriver,
	updateDriver,
	updateDriverStatus,
	getDriverDispatches,
	getMyProfile,
	getMyDispatches,
};
