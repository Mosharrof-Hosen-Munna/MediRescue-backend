import { prisma } from "../../lib/prisma";
import { IGetDriversQuery } from "./driver.interface";

const getAllDrivers = async (
    query: IGetDriversQuery
) => {
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

export const driverService = {
    getAllDrivers,
};