import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma";
import {
  ILoginUserPayload,
  IRegisterPatientPayload,
  IRequestUser,
} from "./auth.interface";
import {
  AuthProvider,
  Role,
  UserStatus,
} from "../../../generated/prisma/enums";
import { jwtUtils } from "../../utils/jwt";
import config from "../../config";
import { SignOptions } from "jsonwebtoken";
import { OAuth2Client, TokenPayload } from "google-auth-library";
import { googleClient } from "../../lib/googleAuth";

const registerPatient = async (payload: IRegisterPatientPayload) => {
  const { firstName, lastName, password, phone } = payload;
  const email = payload.email.trim().toLowerCase();

  const isUserExists = await prisma.user.findFirst({
    where: { OR: [{ email }, { patient: { phone } }] },
  });

  if (isUserExists) {
    throw new Error("User with this email or phone already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 8);

  const createdUser = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      role: Role.PATIENT,
      status: UserStatus.ACTIVE,
      emailVerified: false,
      patient: {
        create: { firstName, lastName, phone },
      },
    },
    omit: { password: true },
    include: { patient: true },
  });

  const { patient, ...user } = createdUser;
  const jwtPayload = {
    userId: user.id,
    firstName: patient?.firstName,
    lastName: patient?.lastName,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_expires_in as SignOptions,
  );

  const refreshToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_refresh_secret,
    config.jwt_refresh_expires_in as SignOptions,
  );

  return {
    user,
    patient,
    accessToken,
    refreshToken,
  };
};

const loginUser = async (payload: ILoginUserPayload) => {
  const { password } = payload;
  const email = payload.email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email },
    include: { patient: true, driver: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (user.status === UserStatus.BLOCKED) {
    throw new Error("User is blocked");
  }

  if (user.isDeleted || user.status === UserStatus.DELETED) {
    throw new Error("User is deleted");
  }

  const isPasswordMatched = await bcrypt.compare(
    password,
    user.password as string,
  );

  if (!isPasswordMatched) {
    throw new Error("Invalid credentials");
  }

  const jwtPayload = {
    userId: user.id,
    firstName: user.patient?.firstName || user.driver?.firstName,
    lastName: user.patient?.lastName || user.driver?.lastName,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_expires_in as SignOptions,
  );

  const refreshToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_refresh_secret,
    config.jwt_refresh_expires_in as SignOptions,
  );

  return {
    accessToken,
    refreshToken,
  };
};
const getMe = async (user: IRequestUser) => {
  const isUserExists = await prisma.user.findUnique({
    where: {
      id: user.userId,
    },
    include: {
      patient: true,
    },
    omit: {
      password: true,
    },
  });

  if (!isUserExists) {
    throw new Error("User not found");
  }

  return isUserExists;
};

const googleLogin = async (token: string) => {
  let googlePayload: TokenPayload | null | undefined = null;

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: config.google_client_id,
    });
    googlePayload = ticket.getPayload();
  } catch (error) {
    console.error("Error verifying Google token:", error);
    throw new Error("Invalid Google token");
  }

  if (!googlePayload || !googlePayload.email || !googlePayload.name) {
    throw new Error("Invalid Google token payload");
  }

  const email = googlePayload.email.trim().toLowerCase();
  const nameParts = googlePayload.name.split(" ");
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(" ");

  if (!email || !firstName || !lastName) {
    throw new Error("Invalid Google token payload");
  }

  let IsUserExists = await prisma.user.findUnique({
    where: { email, role: Role.PATIENT, googleId: googlePayload.sub },
    include: { patient: true, driver: true },
  });
  let user = IsUserExists;

  if (!IsUserExists) {
    const isUserExistsWithEmail = await prisma.user.findUnique({
      where: {
        email,
        role: Role.PATIENT,
        authProvider: AuthProvider.CREDENTIALS,
      },
    });

    if (isUserExistsWithEmail) {
      user = await prisma.user.update({
        where: {
          email,
          role: Role.PATIENT,
          authProvider: AuthProvider.CREDENTIALS,
        },
        data: {
          googleId: googlePayload.sub,
        },
        include: { patient: true, driver: true },
      });
    } else {
      user = await prisma.user.create({
        data: {
          email,
          role: Role.PATIENT,
          status: UserStatus.ACTIVE,
          emailVerified: true,
          googleId: googlePayload.sub,
          authProvider: AuthProvider.GOOGLE,
          patient: {
            create: { firstName, lastName, phone: "" },
          },
        },
        include: { patient: true, driver: true },
      });
    }
  }
  const jwtPayload = {
    userId: user?.id,
    firstName: user?.patient?.firstName || user?.driver?.firstName,
    lastName: user?.patient?.lastName || user?.driver?.lastName,
    email: user?.email,
    role: user?.role,
  };

  const accessToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_expires_in as SignOptions,
  );

  const refreshToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_refresh_secret,
    config.jwt_refresh_expires_in as SignOptions,
  );

  return {
    accessToken,
    refreshToken,
  };
};

export const AuthService = {
  registerPatient,
  loginUser,
  getMe,
  googleLogin,
};
