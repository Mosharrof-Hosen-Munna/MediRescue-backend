import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma";
import { ICreateDriverPayload, IGetDriversQuery } from "./driver.interface";
import { auditLogService } from "../auditLog/auditLog.service";

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

const createDriver = async (
    payload: ICreateDriverPayload,
    adminUserId: string
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
                dateOfBirth: dateOfBirth
                    ? new Date(dateOfBirth)
                    : undefined,
                gender,
                address,
                employeeId,
                licenseNumber,
                licenseExpiryDate: licenseExpiryDate
                    ? new Date(licenseExpiryDate)
                    : undefined,
                status: "OFF_DUTY",
                
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

        return driver;
    });

    // Create audit log
    await auditLogService.createAuditLog({
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

    return result;
};


export const driverService = {
    getAllDrivers,
    createDriver
};