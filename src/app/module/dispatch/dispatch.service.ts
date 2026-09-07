import { prisma } from "../../lib/prisma";
import { auditLogService } from "../auditLog/auditLog.service";
import type { ICreateDispatchPayload } from "./dispatch.interface";

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

export const dispatchService = {
    createDispatch,
};