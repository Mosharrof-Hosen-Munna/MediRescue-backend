import { prisma } from "../../lib/prisma";
import { auditLogService } from "../auditLog/auditLog.service";
import { IGetPatientEmergencyRequestsQuery, IUpdateMyPatientProfilePayload } from "./patient.interface";

const getMyProfile = async (userId: string) => {
    const patient = await prisma.patient.findUnique({
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
        },
    });

    if (!patient) {
        throw new Error("Patient profile not found");
    }

    if (patient.isDeleted || patient.user.isDeleted) {
        throw new Error("Patient profile is deleted");
    }

    return patient;
};

const updateMyProfile = async (
    userId: string,
    payload: IUpdateMyPatientProfilePayload
) => {
    const patient = await prisma.patient.findUnique({
        where: {
            userId,
        },
        select: {
            id: true,
            userId: true,
            firstName: true,
            lastName: true,
            phone: true,
            dateOfBirth: true,
            gender: true,
            bloodGroup: true,
            emergencyContactName: true,
            emergencyContactPhone: true,
            address: true,
            isDeleted: true,
        },
    });

    if (!patient) {
        throw new Error("Patient profile not found");
    }

    if (patient.isDeleted) {
        throw new Error("Cannot update a deleted patient profile");
    }

    if (payload.phone && payload.phone !== patient.phone) {
        const existingPatient = await prisma.patient.findUnique({
            where: {
                phone: payload.phone,
            },
        });

        if (
            existingPatient &&
            existingPatient.id !== patient.id
        ) {
            throw new Error(
                "Patient with this phone number already exists"
            );
        }
    }

    const oldValue = {
        firstName: patient.firstName,
        lastName: patient.lastName,
        phone: patient.phone,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        bloodGroup: patient.bloodGroup,
        emergencyContactName: patient.emergencyContactName,
        emergencyContactPhone: patient.emergencyContactPhone,
        address: patient.address,
    };

    const result = await prisma.$transaction(async (tx) => {
        const updatedPatient = await tx.patient.update({
            where: {
                id: patient.id,
            },
            data: {
                firstName: payload.firstName,
                lastName: payload.lastName,
                phone: payload.phone,
                dateOfBirth: payload.dateOfBirth
                    ? new Date(payload.dateOfBirth)
                    : undefined,
                gender: payload.gender,
                bloodGroup: payload.bloodGroup,
                emergencyContactName:
                    payload.emergencyContactName,
                emergencyContactPhone:
                    payload.emergencyContactPhone,
                address: payload.address,
            },
            select: {
                id: true,
                userId: true,
                firstName: true,
                lastName: true,
                phone: true,
                dateOfBirth: true,
                gender: true,
                bloodGroup: true,
                emergencyContactName: true,
                emergencyContactPhone: true,
                address: true,
                isDeleted: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        await auditLogService.createAuditLog(tx, {
            userId,
            action: "UPDATE",
            entity: "PATIENT",
            entityId: updatedPatient.id,
            oldValue,
            newValue: {
                firstName: updatedPatient.firstName,
                lastName: updatedPatient.lastName,
                phone: updatedPatient.phone,
                dateOfBirth: updatedPatient.dateOfBirth,
                gender: updatedPatient.gender,
                bloodGroup: updatedPatient.bloodGroup,
                emergencyContactName:
                    updatedPatient.emergencyContactName,
                emergencyContactPhone:
                    updatedPatient.emergencyContactPhone,
                address: updatedPatient.address,
            },
            description: "Patient profile updated",
        });

        return updatedPatient;
    });

    return result;
};

const getPatientEmergencyRequests = async (
    patientId: string,
    query: IGetPatientEmergencyRequestsQuery
) => {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const patient = await prisma.patient.findUnique({
        where: {
            id: patientId,
        },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            isDeleted: true,
        },
    });

    if (!patient) {
        throw new Error("Patient not found");
    }

    if (patient.isDeleted) {
        throw new Error("Patient profile is deleted");
    }

    const where = {
        patientId,
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

                        ambulance: {
                            select: {
                                id: true,
                                registrationNo: true,
                                model: true,
                                manufacturer: true,
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
        patient,
        data,
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};

export const patientService = {
    getMyProfile,
    updateMyProfile,
    getPatientEmergencyRequests
};