import { Prisma, Role, UserStatus } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { auditLogService } from "../auditLog/auditLog.service";
import { IGetUsersQuery, IUpdateMyProfilePayload } from "./user.interface";

const getMyProfile = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: {
            id: userId,
        },
        select: {
            id: true,
            email: true,
            emailVerified: true,
            role: true,
            status: true,
            needPasswordChange: true,
            createdAt: true,
            updatedAt: true,

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
                    address: true,
                    createdAt: true,
                    updatedAt: true,
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
                    createdAt: true,
                    updatedAt: true,

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
            },
        },
    });

    if (!user) {
        throw new Error("User not found");
    }

    return user;
};

const updateMyProfile = async (
    userId: string,
    payload: IUpdateMyProfilePayload
) => {
    const user = await prisma.user.findUnique({
        where: {
            id: userId,
        },
        select: {
            id: true,
            email: true,
            emailVerified: true,
            role: true,
            status: true,
            needPasswordChange: true,
            isDeleted: true,
        },
    });

    if (!user) {
        throw new Error("User not found");
    }

    if (user.isDeleted) {
        throw new Error("Cannot update a deleted user");
    }

    if (payload.email && payload.email !== user.email) {
        const existingUser = await prisma.user.findUnique({
            where: {
                email: payload.email,
            },
        });

        if (existingUser && existingUser.id !== userId) {
            throw new Error(
                "User with this email already exists"
            );
        }
    }

    const oldValue = {
        email: user.email,
    };

    const result = await prisma.$transaction(async (tx) => {
        const updatedUser = await tx.user.update({
            where: {
                id: userId,
            },
            data: {
                email: payload.email,
                // If email changes, it should require verification again.
                ...(payload.email &&
                    payload.email !== user.email && {
                        emailVerified: false,
                    }),
            },
            select: {
                id: true,
                email: true,
                emailVerified: true,
                role: true,
                status: true,
                needPasswordChange: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        await auditLogService.createAuditLog(tx, {
            userId,
            action: "UPDATE",
            entity: "USER",
            entityId: updatedUser.id,
            oldValue,
            newValue: {
                email: updatedUser.email,
                emailVerified: updatedUser.emailVerified,
            },
            description: "User profile updated",
        });

        return updatedUser;
    });

    return result;
};

const getUsers = async (query: IGetUsersQuery) => {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
        isDeleted: false,
        ...(query.role && {
            role: query.role as Role,
        }),
        ...(query.status && {
            status: query.status as UserStatus,
        }),
        ...(query.search && {
            OR: [
                {
                    email: {
                        contains: query.search,
                        mode: "insensitive",
                    },
                },
                {
                    patient: {
                        firstName: {
                            contains: query.search,
                            mode: "insensitive",
                        },
                    },
                },
                {
                    patient: {
                        lastName: {
                            contains: query.search,
                            mode: "insensitive",
                        },
                    },
                },
                {
                    driver: {
                        firstName: {
                            contains: query.search,
                            mode: "insensitive",
                        },
                    },
                },
                {
                    driver: {
                        lastName: {
                            contains: query.search,
                            mode: "insensitive",
                        },
                    },
                },
            ],
        }),
    };

    const [users, total] = await Promise.all([
        prisma.user.findMany({
            where,
            skip,
            take: limit,
            orderBy: {
                createdAt: "desc",
            },
            select: {
                id: true,
                email: true,
                emailVerified: true,
                role: true,
                status: true,
                needPasswordChange: true,
                createdAt: true,
                updatedAt: true,

                patient: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        phone: true,
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
        }),

        prisma.user.count({
            where,
        }),
    ]);

    return {
        data: users,
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};

export const userService = {
    updateMyProfile,
    getMyProfile,
    getUsers
};