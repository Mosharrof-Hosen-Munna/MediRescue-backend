import { prisma } from "../../lib/prisma";
import { ICreateAmbulancePayload } from "./ambulance.interface";

const createAmbulance = async (
    payload: ICreateAmbulancePayload
) => {
    const {
        registrationNo,
        model,
        manufacturer,
        year,
        capacity,
        typeId,
        driverId,
    } = payload;

    const existingAmbulance =
        await prisma.ambulance.findUnique({
            where: {
                registrationNo,
            },
        });

    if (existingAmbulance) {
        throw new Error("Ambulance with this registration number already exists");
    }

    const ambulanceType =
        await prisma.ambulanceType.findUnique({
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

        const driverHasAmbulance =
            await prisma.ambulance.findUnique({
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

export const ambulanceService = {
    createAmbulance,
};