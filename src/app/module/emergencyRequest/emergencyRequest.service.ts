import { Role } from "./../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import {
	ICancelEmergencyRequestPayload,
	ICreateEmergencyRequestPayload,
	IGetEmergencyRequestByIdParams,
	IGetMyEmergencyRequestsQuery,
	IUpdateEmergencyRequestPayload,
} from "./emergencyRequest.interface";
import { IGetEmergencyRequestsQuery } from "./emergencyRequest.interface";
import { auditLogService } from "../auditLog/auditLog.service";

const createEmergencyRequest = async (
	userId: string,
	payload: ICreateEmergencyRequestPayload,
) => {
	const {
		serviceTypeId,
		ambulanceTypeId,
		pickupAddress,
		emergencyDescription,
		patientCondition,
		additionalNotes,
	} = payload;

	// Find patient profile
	const patient = await prisma.patient.findUnique({
		where: {
			userId,
		},
	});

	if (!patient) {
		throw new Error("Patient profile not found");
	}

	// Check service type
	const serviceType = await prisma.serviceType.findUnique({
		where: {
			id: serviceTypeId,
		},
	});

	if (!serviceType) {
		throw new Error("Service type not found");
	}

	if (!serviceType.isActive) {
		throw new Error("Service type is not available");
	}

	// Check ambulance type
	const ambulanceType = await prisma.ambulanceType.findUnique({
		where: {
			id: ambulanceTypeId,
		},
	});

	if (!ambulanceType) {
		throw new Error("Ambulance type not found");
	}

	if (!ambulanceType.isActive) {
		throw new Error("Ambulance type is not available");
	}

	// Generate request number
	const requestNumber = `REQ-${Date.now()}`;

	// Create emergency request
	const emergencyRequest = await prisma.emergencyRequest.create({
		data: {
			requestNumber,
			patientId: patient.id,
			serviceTypeId,
			ambulanceTypeId,
			pickupAddress,
			emergencyDescription,
			patientCondition,
			additionalNotes,
		},
		include: {
			patient: {
				select: {
					id: true,
					firstName: true,
					lastName: true,
					phone: true,
				},
			},
			serviceType: true,
			ambulanceType: true,
		},
	});

	return emergencyRequest;
};

const getAllEmergencyRequests = async (query: IGetEmergencyRequestsQuery) => {
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
					requestNumber: {
						contains: query.search,
						mode: "insensitive" as const,
					},
				},
				{
					pickupAddress: {
						contains: query.search,
						mode: "insensitive" as const,
					},
				},
				{
					patient: {
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
						],
					},
				},
			],
		}),
	};

	const [requests, total] = await prisma.$transaction([
		prisma.emergencyRequest.findMany({
			where,
			skip,
			take: limit,

			orderBy: {
				requestedAt: "desc",
			},

			include: {
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

				dispatch: {
					select: {
						id: true,
						status: true,
						assignedAt: true,
						acceptedAt: true,

						ambulance: {
							select: {
								id: true,
								registrationNo: true,
								model: true,
							},
						},

						driver: {
							select: {
								id: true,
								firstName: true,
								lastName: true,
								phone: true,
							},
						},
					},
				},
			},
		}),

		prisma.emergencyRequest.count({
			where,
		}),
	]);

	return {
		data: requests,
		meta: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
	};
};

const getEmergencyRequestById = async (
	id: string,
	userId: string,
	userRole: string,
) => {
	const emergencyRequest = await prisma.emergencyRequest.findUnique({
		where: {
			id,
		},
		include: {
			patient: {
				select: {
					id: true,
					firstName: true,
					lastName: true,
					phone: true,
					dateOfBirth: true,
					gender: true,
					bloodGroup: true,
					emergencyContactName: true,
					emergencyContactPhone: true,
					userId: true,
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
					baseFare: true,
				},
			},
			dispatch: {
				include: {
					ambulance: {
						include: {
							type: true,
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
						},
					},
				},
			},
		},
	});

	if (!emergencyRequest) {
		throw new Error("Emergency request not found");
	}

	if (userRole === "PATIENT" && emergencyRequest.patient.userId !== userId) {
		throw new Error("You are not allowed to view this emergency request");
	}

	return emergencyRequest;
};

const updateEmergencyRequest = async (
	id: string,
	userId: string,
	userRole: string,
	payload: IUpdateEmergencyRequestPayload,
) => {
	const emergencyRequest = await prisma.emergencyRequest.findUnique({
		where: {
			id,
		},
		include: {
			patient: {
				select: {
					userId: true,
				},
			},
		},
	});

	if (!emergencyRequest) {
		throw new Error("Emergency request not found");
	}

	if (userRole === "PATIENT" && emergencyRequest.patient.userId !== userId) {
		throw new Error("You are not allowed to update this emergency request");
	}

	if (userRole === "PATIENT" && emergencyRequest.status !== "PENDING") {
		throw new Error("Only pending emergency requests can be updated");
	}

	if (payload.serviceTypeId) {
		const serviceType = await prisma.serviceType.findUnique({
			where: {
				id: payload.serviceTypeId,
			},
		});

		if (!serviceType || !serviceType.isActive) {
			throw new Error("Active service type not found");
		}
	}

	if (payload.ambulanceTypeId) {
		const ambulanceType = await prisma.ambulanceType.findUnique({
			where: {
				id: payload.ambulanceTypeId,
			},
		});

		if (!ambulanceType || !ambulanceType.isActive) {
			throw new Error("Active ambulance type not found");
		}
	}

	const oldValue = {
		serviceTypeId: emergencyRequest.serviceTypeId,
		ambulanceTypeId: emergencyRequest.ambulanceTypeId,
		pickupAddress: emergencyRequest.pickupAddress,
		emergencyDescription: emergencyRequest.emergencyDescription,
		patientCondition: emergencyRequest.patientCondition,
		additionalNotes: emergencyRequest.additionalNotes,
	};

	const result = await prisma.$transaction(async (tx) => {
		const updatedRequest = await tx.emergencyRequest.update({
			where: {
				id,
			},
			data: {
				...(payload.serviceTypeId && {
					serviceTypeId: payload.serviceTypeId,
				}),
				...(payload.ambulanceTypeId && {
					ambulanceTypeId: payload.ambulanceTypeId,
				}),
				...(payload.pickupAddress && {
					pickupAddress: payload.pickupAddress,
				}),
				...(payload.emergencyDescription !== undefined && {
					emergencyDescription: payload.emergencyDescription,
				}),
				...(payload.patientCondition !== undefined && {
					patientCondition: payload.patientCondition,
				}),
				...(payload.additionalNotes !== undefined && {
					additionalNotes: payload.additionalNotes,
				}),
			},
			include: {
				patient: {
					select: {
						id: true,
						firstName: true,
						lastName: true,
						phone: true,
					},
				},
				serviceType: true,
				ambulanceType: true,
				dispatch: {
					include: {
						ambulance: true,
						driver: {
							select: {
								id: true,
								firstName: true,
								lastName: true,
								phone: true,
							},
						},
					},
				},
			},
		});

		await auditLogService.createAuditLog(tx, {
			userId,
			action: "UPDATE",
			entity: "EMERGENCY_REQUEST",
			entityId: id,
			oldValue,
			newValue: {
				serviceTypeId: updatedRequest.serviceTypeId,
				ambulanceTypeId: updatedRequest.ambulanceTypeId,
				pickupAddress: updatedRequest.pickupAddress,
				emergencyDescription: updatedRequest.emergencyDescription,
				patientCondition: updatedRequest.patientCondition,
				additionalNotes: updatedRequest.additionalNotes,
			},
			description: "Emergency request updated",
		});

		return updatedRequest;
	});

	return result;
};

const cancelEmergencyRequest = async (
	id: string,
	userId: string,
	userRole: "PATIENT" | "ADMIN",
	payload: ICancelEmergencyRequestPayload,
) => {
	const emergencyRequest = await prisma.emergencyRequest.findUnique({
		where: {
			id,
		},
		include: {
			patient: {
				select: {
					userId: true,
				},
			},
		},
	});

	if (!emergencyRequest) {
		throw new Error("Emergency request not found");
	}

	if (userRole === "PATIENT" && emergencyRequest.patient.userId !== userId) {
		throw new Error("You are not allowed to cancel this emergency request");
	}

	if (
		["COMPLETED", "CANCELLED", "REJECTED", "NO_AMBULANCE_AVAILABLE"].includes(
			emergencyRequest.status,
		)
	) {
		throw new Error(
			`Emergency request cannot be cancelled because it is already ${emergencyRequest.status.toLowerCase().replaceAll("_", " ")}`,
		);
	}

	if (userRole === "PATIENT" && emergencyRequest.status !== "PENDING") {
		throw new Error("You can only cancel a pending emergency request");
	}

	const oldValue = {
		status: emergencyRequest.status,
		cancelledAt: emergencyRequest.cancelledAt,
		cancellationReason: emergencyRequest.cancellationReason,
	};

	const result = await prisma.$transaction(async (tx) => {
		const updatedRequest = await tx.emergencyRequest.update({
			where: {
				id,
			},
			data: {
				status: "CANCELLED",
				cancelledAt: new Date(),
				cancellationReason: payload.cancellationReason,
			},
			include: {
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
						baseFare: true,
					},
				},
				dispatch: {
					include: {
						ambulance: true,
						driver: {
							select: {
								id: true,
								firstName: true,
								lastName: true,
								phone: true,
							},
						},
					},
				},
			},
		});

		await auditLogService.createAuditLog(tx, {
			userId,
			action: "STATUS_CHANGE",
			entity: "EMERGENCY_REQUEST",
			entityId: id,
			oldValue,
			newValue: {
				status: updatedRequest.status,
				cancelledAt: updatedRequest.cancelledAt,
				cancellationReason: updatedRequest.cancellationReason,
			},
			description: "Emergency request cancelled",
		});

		return updatedRequest;
	});

	return result;
};

const getMyEmergencyRequests = async (
	userId: string,
	query: IGetMyEmergencyRequestsQuery,
) => {
	const page = Number(query.page) || 1;
	const limit = Number(query.limit) || 10;
	const skip = (page - 1) * limit;

	const patient = await prisma.patient.findUnique({
		where: {
			userId,
		},
		select: {
			id: true,
			isDeleted: true,
		},
	});

	if (!patient) {
		throw new Error("Patient profile not found");
	}

	if (patient.isDeleted) {
		throw new Error("Patient profile is deleted");
	}

	const where = {
		patientId: patient.id,
		...(query.status && {
			status: query.status,
		}),
	};

	const [data, total] = await Promise.all([
		prisma.emergencyRequest.findMany({
			where,
			skip,
			take: limit,
			orderBy: {
				requestedAt: "desc",
			},
			select: {
				id: true,
				requestNumber: true,
				pickupAddress: true,
				emergencyDescription: true,
				patientCondition: true,
				additionalNotes: true,
				status: true,
				requestedAt: true,
				cancelledAt: true,
				cancellationReason: true,
				createdAt: true,
				updatedAt: true,

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
						baseFare: true,
					},
				},

				dispatch: {
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

						ambulance: {
							select: {
								id: true,
								registrationNo: true,
								model: true,
								manufacturer: true,
								status: true,
							},
						},

						driver: {
							select: {
								id: true,
								firstName: true,
								lastName: true,
								phone: true,
								employeeId: true,
							},
						},
					},
				},
			},
		}),

		prisma.emergencyRequest.count({
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
export const emergencyRequestService = {
	getAllEmergencyRequests,
	createEmergencyRequest,
	getEmergencyRequestById,
	updateEmergencyRequest,
	cancelEmergencyRequest,
	getMyEmergencyRequests,
};
