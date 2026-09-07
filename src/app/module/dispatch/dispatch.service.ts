import { Prisma } from "../../../generated/prisma/client";
import { DispatchStatus } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { auditLogService } from "../auditLog/auditLog.service";
import type {  ICreateDispatchPayload, IGetDispatchesQuery, IGetMyDispatchesQuery, IUpdateDispatchActionPayload, IUpdateDispatchPayload } from "./dispatch.interface";

const createDispatch = async (
    userId: string,
    payload: ICreateDispatchPayload
) => {
    const {
        emergencyRequestId,
        ambulanceId,
        driverId,
    } = payload;

    const [
        emergencyRequest,
        ambulance,
        driver,
    ] = await Promise.all([
        prisma.emergencyRequest.findUnique({
            where: {
                id: emergencyRequestId,
            },
            include: {
                ambulanceType: true,
            },
        }),

        prisma.ambulance.findUnique({
            where: {
                id: ambulanceId,
            },
            include: {
                type: true,
                driver: true,
            },
        }),

        prisma.driver.findUnique({
            where: {
                id: driverId,
            },
        }),
    ]);

    if (!emergencyRequest) {
        throw new Error("Emergency request not found");
    }

    if (
        emergencyRequest.status !== "PENDING"
    ) {
        throw new Error(
            "Only pending emergency requests can be dispatched"
        );
    }

    if (!ambulance) {
        throw new Error("Ambulance not found");
    }

    if (ambulance.isDeleted) {
        throw new Error("Ambulance is deleted");
    }

    if (
        ambulance.status !== "AVAILABLE"
    ) {
        throw new Error(
            "Ambulance is not available"
        );
    }

    if (!driver) {
        throw new Error("Driver not found");
    }

    if (driver.isDeleted) {
        throw new Error("Driver is deleted");
    }

    if (driver.status !== "AVAILABLE") {
        throw new Error(
            "Driver is not available"
        );
    }

    if (ambulance.driverId !== driverId) {
        throw new Error(
            "Selected driver is not assigned to this ambulance"
        );
    }

    if (
        ambulance.typeId !==
        emergencyRequest.ambulanceTypeId
    ) {
        throw new Error(
            "Selected ambulance does not match the requested ambulance type"
        );
    }

    const existingDispatch =
        await prisma.dispatch.findUnique({
            where: {
                emergencyRequestId,
            },
        });

    if (existingDispatch) {
        throw new Error(
            "This emergency request already has a dispatch"
        );
    }

    const result = await prisma.$transaction(
        async (tx) => {
            const dispatch =
                await tx.dispatch.create({
                    data: {
                        emergencyRequestId,
                        ambulanceId,
                        driverId,
                        status: "ASSIGNED",
                    },
                    include: {
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
                                        baseFare: true,
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
                });

            await tx.emergencyRequest.update({
                where: {
                    id: emergencyRequestId,
                },
                data: {
                    status: "DISPATCHED",
                },
            });

            await tx.ambulance.update({
                where: {
                    id: ambulanceId,
                },
                data: {
                    status: "ASSIGNED",
                },
            });

            await tx.driver.update({
                where: {
                    id: driverId,
                },
                data: {
                    status: "BUSY",
                },
            });

            await auditLogService.createAuditLog(
                tx,
                {
                    userId,
                    action: "CREATE",
                    entity: "DISPATCH",
                    entityId: dispatch.id,
                    newValue: {
                        emergencyRequestId,
                        ambulanceId,
                        driverId,
                        status: dispatch.status,
                    },
                    description:
                        "Ambulance and driver assigned to emergency request",
                }
            );

            return dispatch;
        }
    );

    return result;
};

const getDispatches = async (
    query: IGetDispatchesQuery
) => {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where = {
        ...(query.status && {
            status: query.status,
        }),

        ...(query.driverId && {
            driverId: query.driverId,
        }),

        ...(query.ambulanceId && {
            ambulanceId: query.ambulanceId,
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
                                description: true,
                            },
                        },

                        ambulanceType: {
                            select: {
                                id: true,
                                name: true,
                                baseFare: true,
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
                        year: true,
                        capacity: true,
                        status: true,

                        type: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
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

const getDispatchById = async (id: string) => {
    const dispatch = await prisma.dispatch.findUnique({
        where: {
            id,
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
                    cancelledAt: true,
                    cancellationReason: true,

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

            driver: {
                select: {
                    id: true,
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
                },
            },
        },
    });

    if (!dispatch) {
        throw new Error("Dispatch not found");
    }

    return dispatch;
};

const updateDispatch = async (
    id: string,
    userId: string,
    payload: IUpdateDispatchPayload
) => {
    if (
        payload.ambulanceId === undefined &&
        payload.driverId === undefined
    ) {
        throw new Error(
            "At least one field is required to update dispatch"
        );
    }

    const dispatch = await prisma.dispatch.findUnique({
        where: {
            id,
        },
        include: {
            emergencyRequest: true,
            ambulance: true,
            driver: true,
        },
    });

    if (!dispatch) {
        throw new Error("Dispatch not found");
    }

    if (
        [
            "COMPLETED",
            "CANCELLED",
        ].includes(dispatch.status)
    ) {
        throw new Error(
            "Completed or cancelled dispatch cannot be updated"
        );
    }

    const ambulanceId =
        payload.ambulanceId ?? dispatch.ambulanceId;

    const driverId =
        payload.driverId ?? dispatch.driverId;

    const [ambulance, driver] = await Promise.all([
        prisma.ambulance.findUnique({
            where: {
                id: ambulanceId,
            },
        }),

        prisma.driver.findUnique({
            where: {
                id: driverId,
            },
        }),
    ]);

    if (!ambulance) {
        throw new Error("Ambulance not found");
    }

    if (ambulance.isDeleted) {
        throw new Error("Ambulance is deleted");
    }

    if (
        ambulance.status !== "AVAILABLE" &&
        ambulance.id !== dispatch.ambulanceId
    ) {
        throw new Error(
            "Selected ambulance is not available"
        );
    }

    if (!driver) {
        throw new Error("Driver not found");
    }

    if (driver.isDeleted) {
        throw new Error("Driver is deleted");
    }

    if (
        driver.status !== "AVAILABLE" &&
        driver.id !== dispatch.driverId
    ) {
        throw new Error(
            "Selected driver is not available"
        );
    }

    if (ambulance.driverId !== driverId) {
        throw new Error(
            "Selected driver is not assigned to this ambulance"
        );
    }

    if (
        ambulance.typeId !==
        dispatch.emergencyRequest.ambulanceTypeId
    ) {
        throw new Error(
            "Selected ambulance does not match the requested ambulance type"
        );
    }

    const existingDispatch = await prisma.dispatch.findFirst({
        where: {
            id: {
                not: id,
            },
            OR: [
                {
                    ambulanceId,
                    status: {
                        notIn: [
                            "COMPLETED",
                            "CANCELLED",
                            "REJECTED",
                        ],
                    },
                },
                {
                    driverId,
                    status: {
                        notIn: [
                            "COMPLETED",
                            "CANCELLED",
                            "REJECTED",
                        ],
                    },
                },
            ],
        },
    });

    if (existingDispatch) {
        throw new Error(
            "Selected ambulance or driver is already assigned to another active dispatch"
        );
    }

    const oldValue = {
        ambulanceId: dispatch.ambulanceId,
        driverId: dispatch.driverId,
        status: dispatch.status,
    };

    const result = await prisma.$transaction(
        async (tx) => {
            if (ambulanceId !== dispatch.ambulanceId) {
                await tx.ambulance.update({
                    where: {
                        id: dispatch.ambulanceId,
                    },
                    data: {
                        status: "AVAILABLE",
                    },
                });
            }

            if (driverId !== dispatch.driverId) {
                await tx.driver.update({
                    where: {
                        id: dispatch.driverId,
                    },
                    data: {
                        status: "AVAILABLE",
                    },
                });
            }

            const updatedDispatch =
                await tx.dispatch.update({
                    where: {
                        id,
                    },
                    data: {
                        ambulanceId,
                        driverId,
                    },
                    include: {
                        emergencyRequest: {
                            select: {
                                id: true,
                                requestNumber: true,
                                pickupAddress: true,
                                emergencyDescription: true,
                                patientCondition: true,
                                status: true,
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
                                        baseFare: true,
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
                                type: {
                                    select: {
                                        id: true,
                                        name: true,
                                    },
                                },
                            },
                        },
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

            await tx.ambulance.update({
                where: {
                    id: ambulanceId,
                },
                data: {
                    status: "ASSIGNED",
                },
            });

            await tx.driver.update({
                where: {
                    id: driverId,
                },
                data: {
                    status: "BUSY",
                },
            });

            await auditLogService.createAuditLog(
                tx,
                {
                    userId,
                    action: "UPDATE",
                    entity: "DISPATCH",
                    entityId: id,
                    oldValue,
                    newValue: {
                        ambulanceId:
                            updatedDispatch.ambulanceId,
                        driverId:
                            updatedDispatch.driverId,
                        status:
                            updatedDispatch.status,
                    },
                    description:
                        "Dispatch assignment updated",
                }
            );

            return updatedDispatch;
        }
    );

    return result;
};

const updateDispatchAction = async (
    userId: string,
    payload: IUpdateDispatchActionPayload
) => {
    const dispatch = await prisma.dispatch.findUnique({
        where: {
            id: payload.id,
        },
        include: {
            driver: {
                select: {
                    id: true,
                    userId: true,
                    firstName: true,
                    lastName: true,
                    phone: true,
                    employeeId: true,
                },
            },
            ambulance: {
                select: {
                    id: true,
                    registrationNo: true,
                    model: true,
                },
            },
            emergencyRequest: {
                select: {
                    id: true,
                    requestNumber: true,
                    pickupAddress: true,
                    status: true,
                },
            },
        },
    });

    if (!dispatch) {
        throw new Error("Dispatch not found");
    }

    if (dispatch.driver.userId !== userId) {
        throw new Error(
            "You are not allowed to update this dispatch"
        );
    }

    if (dispatch.status !== DispatchStatus.ASSIGNED) {
        throw new Error(
            `Dispatch cannot be ${payload.status} from ${dispatch.status} status`
        );
    }

    if (
        payload.status === "reject" &&
        !payload.rejectionReason
    ) {
        throw new Error(
            "Rejection reason is required when rejecting a dispatch"
        );
    }

    const oldValue = {
        status: dispatch.status,
        acceptedAt: dispatch.acceptedAt,
        cancellationReason: dispatch.cancellationReason,
    };

    const result = await prisma.$transaction(async (tx) => {
        let updatedDispatch;

        if (payload.status === "accept") {
            updatedDispatch = await tx.dispatch.update({
                where: {
                    id: dispatch.id,
                },
                data: {
                    status: DispatchStatus.ACCEPTED,
                    acceptedAt: new Date(),
                },
                include: {
                    emergencyRequest: {
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
            });
        } else {
            updatedDispatch = await tx.dispatch.update({
                where: {
                    id: dispatch.id,
                },
                data: {
                    status: DispatchStatus.REJECTED,
                    cancelledAt: new Date(),
                    cancellationReason:
                        payload.rejectionReason,
                },
                include: {
                    emergencyRequest: {
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
            });

            // Release resources so they can be assigned again.
            await tx.ambulance.update({
                where: {
                    id: dispatch.ambulanceId,
                },
                data: {
                    status: "AVAILABLE",
                },
            });

            await tx.driver.update({
                where: {
                    id: dispatch.driverId,
                },
                data: {
                    status: "AVAILABLE",
                },
            });

            // The request can be dispatched again by admin.
            await tx.emergencyRequest.update({
                where: {
                    id: dispatch.emergencyRequestId,
                },
                data: {
                    status: "PENDING",
                },
            });
        }

        await auditLogService.createAuditLog(tx, {
            userId,
            action: "STATUS_CHANGE",
            entity: "DISPATCH",
            entityId: dispatch.id,
            oldValue,
            newValue: {
                status: updatedDispatch.status,
                acceptedAt: updatedDispatch.acceptedAt,
                cancellationReason:
                    updatedDispatch.cancellationReason,
            },
            description:
                payload.status === "accept"
                    ? `Driver accepted dispatch ${dispatch.id}`
                    : `Driver rejected dispatch ${dispatch.id}`,
        });

        return updatedDispatch;
    });

    return result;
};

const getMyDispatches = async (
    userId: string,
    query: IGetMyDispatchesQuery
    
) => {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const driver = await prisma.driver.findFirst({
        where: {
            userId,
            isDeleted: false,
        },
        select: {
            id: true,
        },
    });

    if (!driver) {
        throw new Error("Driver not found");
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
                                dateOfBirth: true,
                                gender: true,
                                bloodGroup: true,
                                emergencyContactName: true,
                                emergencyContactPhone: true,
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


export const dispatchService = {
    createDispatch,
    getDispatches,
    getDispatchById,
    updateDispatch,
    updateDispatchAction,
    getMyDispatches
};