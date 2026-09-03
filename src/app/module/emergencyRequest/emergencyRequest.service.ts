import { prisma } from "../../lib/prisma";
import { ICreateEmergencyRequestPayload } from "./emergencyRequest.interface";

const createEmergencyRequest = async (
    userId: string,
    payload: ICreateEmergencyRequestPayload
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

export const emergencyRequestService = {
    createEmergencyRequest,
};