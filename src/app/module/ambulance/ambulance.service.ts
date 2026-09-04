import { prisma } from "../../lib/prisma";
import { ICreateAmbulancePayload, IGetAmbulancesQuery } from "./ambulance.interface";

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

const getAllAmbulances = async (
    query: IGetAmbulancesQuery
) => {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where = {
        ...(query.status && {
            status: query.status as any,
        }),

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

export const ambulanceService = {
    createAmbulance,
    getAllAmbulances
};