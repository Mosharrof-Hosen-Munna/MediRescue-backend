import { UploadApiResponse } from "cloudinary";
import type {
  Prisma,
  Role,
  UserStatus,
} from "../../../generated/prisma/client";
import { cloudinary } from "../../lib/cloudinary";
import { prisma } from "../../lib/prisma";
import { auditLogService } from "../auditLog/auditLog.service";
import type { IGetUsersQuery, IUpdateMyProfilePayload } from "./user.interface";

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
const updateProfilePhoto = async (buffer: Buffer, user: any) => {

	let currentUser = null;
	if(user.role === "PATIENT"||user.role === "ADMIN"){
		currentUser = await prisma.patient.findUnique({
			where: {
				userId: user.userId,
			},
			select: {
				profilePhoto:true,
				profilePhotoPublicId: true,
			},
		});
	}else if(user.role === "DRIVER"){
		currentUser = await prisma.driver.findUnique({
			where: {
				userId: user.userId,
			},
			select: {
				profilePhoto:true,
				profilePhotoPublicId: true,
			},
		});
	}

  const result = await new Promise<UploadApiResponse >((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        { resource_type: "auto" },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
			if(!result) {
			return	reject(new Error("No result returned from Cloudinary"));
			}
            resolve(result);
          }
        },
      )
      .end(buffer);
  });

  let updatedProfile = null
	 if(user.role === "PATIENT"||user.role === "ADMIN"){
		updatedProfile = await prisma.patient.update({
			where: {
				userId: user.userId,
			},
			data: {
				profilePhoto: result?.secure_url,
				profilePhotoPublicId: result?.public_id,
			},

		});
	 }else if(user.role === "DRIVER"){
		updatedProfile = await prisma.driver.update({
			where: {
				userId: user.userId,
			},
			data: {
				profilePhoto: result?.secure_url,
				profilePhotoPublicId: result?.public_id,
			},
		});

	 }
	 if(currentUser?.profilePhotoPublicId && updatedProfile){
		await cloudinary.uploader.destroy(currentUser.profilePhotoPublicId);
	 }


    return updatedProfile;
};

const updateMyProfile = async (
  userId: string,
  payload: IUpdateMyProfilePayload,
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
      throw new Error("User with this email already exists");
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

const getUserById = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      email: true,
      emailVerified: true,
      role: true,
      status: true,
      needPasswordChange: true,
      isDeleted: true,
      deletedAt: true,
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

const updateUserStatus = async (
  id: string,
  status: UserStatus,
  adminUserId: string,
) => {
  const user = await prisma.user.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      isDeleted: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (user.isDeleted) {
    throw new Error("Cannot update status of a deleted user");
  }

  if (user.id === adminUserId) {
    throw new Error("You cannot change your own status");
  }

  if (user.status === status) {
    throw new Error(`User is already ${status}`);
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: {
        id,
      },
      data: {
        status,
      },
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
    });

    await auditLogService.createAuditLog(tx, {
      userId: adminUserId,
      action: "STATUS_CHANGE",
      entity: "USER",
      entityId: updatedUser.id,
      oldValue: {
        status: user.status,
      },
      newValue: {
        status: updatedUser.status,
      },
      description: `User status changed from ${user.status} to ${updatedUser.status}`,
    });

    return updatedUser;
  });

  return result;
};

const deleteUser = async (id: string, adminUserId: string) => {
  const user = await prisma.user.findUnique({
    where: {
      id,
    },
    include: {
      patient: true,
      driver: {
        include: {
          ambulance: true,
          dispatches: {
            where: {
              status: {
                in: [
                  "ASSIGNED",
                  "ACCEPTED",
                  "EN_ROUTE",
                  "ARRIVED",
                  "PATIENT_PICKED_UP",
                  "AT_HOSPITAL",
                ],
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

  if (user.isDeleted) {
    throw new Error("User is already deleted");
  }

  if (user.id === adminUserId) {
    throw new Error("You cannot delete your own account");
  }

  // Driver-specific checks
  if (user.driver) {
    if (user.driver.isDeleted) {
      throw new Error("Driver profile is already deleted");
    }

    if (user.driver.ambulance) {
      throw new Error("Cannot delete a driver who is assigned to an ambulance");
    }

    if (user.driver.dispatches.length > 0) {
      throw new Error("Cannot delete a driver with an active dispatch");
    }
  }

  const deletedAt = new Date();

  const result = await prisma.$transaction(async (tx) => {
    // Soft delete User
    const deletedUser = await tx.user.update({
      where: {
        id: user.id,
      },
      data: {
        isDeleted: true,
        deletedAt,
        status: "INACTIVE",
      },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        isDeleted: true,
        deletedAt: true,
        updatedAt: true,
      },
    });

    // Soft delete Patient profile
    if (user.patient) {
      await tx.patient.update({
        where: {
          id: user.patient.id,
        },
        data: {
          isDeleted: true,
          deletedAt,
        },
      });
    }

    // Soft delete Driver profile
    if (user.driver) {
      await tx.driver.update({
        where: {
          id: user.driver.id,
        },
        data: {
          isDeleted: true,
          deletedAt,
          status: "OFF_DUTY",
        },
      });
    }

    // Create audit log
    await auditLogService.createAuditLog(tx, {
      userId: adminUserId,
      action: "SOFT_DELETE",
      entity: "USER",
      entityId: deletedUser.id,
      oldValue: {
        email: user.email,
        role: user.role,
        status: user.status,
        isDeleted: user.isDeleted,
        deletedAt: user.deletedAt,
        patientId: user.patient?.id ?? null,
        driverId: user.driver?.id ?? null,
      },
      newValue: {
        email: deletedUser.email,
        role: deletedUser.role,
        status: deletedUser.status,
        isDeleted: deletedUser.isDeleted,
        deletedAt: deletedUser.deletedAt,
        patientDeleted: !!user.patient,
        driverDeleted: !!user.driver,
      },
      description: "User and associated profile soft deleted",
    });

    return deletedUser;
  });

  return result;
};

export const userService = {
  updateMyProfile,
  getMyProfile,
  getUsers,
  getUserById,
  updateUserStatus,
  deleteUser,
  updateProfilePhoto,
};
