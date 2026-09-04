import { Role } from './../../../generated/prisma/enums';
import { prisma } from "../../lib/prisma";
import { ICreateEmergencyRequestPayload, IGetEmergencyRequestByIdParams } from "./emergencyRequest.interface";
import { IGetEmergencyRequestsQuery } from "./emergencyRequest.interface";

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
    userRole: string
) => {
    const emergencyRequest =
        await prisma.emergencyRequest.findUnique({
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
                        userId:true
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

    if (
        userRole === "PATIENT" &&
        emergencyRequest.patient.userId !== userId
    ) {
        throw new Error(
            "You are not allowed to view this emergency request"
        );
    }

    return emergencyRequest;
};


export const emergencyRequestService = {
  getAllEmergencyRequests,
  createEmergencyRequest,
  getEmergencyRequestById
};
