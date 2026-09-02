
import bcrypt from "bcryptjs"
import { prisma } from "../../lib/prisma"
import { ILoginUserPayload, IRegisterPatientPayload } from "./auth.interface"
import { Role, UserStatus } from "../../../generated/prisma/enums"
import { jwtUtils } from "../../utils/jwt"
import config from "../../config"
import { SignOptions } from "jsonwebtoken"

const registerPatient = async (payload: IRegisterPatientPayload) => {
    const { firstName,lastName, password,phone } = payload
    const email = payload.email.trim().toLowerCase()

    const isUserExists = await prisma.user.findFirst({
        where: { OR: [{ email }, { patient: { phone } }] },
    })

    if (isUserExists) {
        throw new Error('User with this email or phone already exists')
    }

    const hashedPassword = await bcrypt.hash(password, 8)

    const createdUser = await prisma.user.create({
        data: {
            email,
            password: hashedPassword,
            role: Role.PATIENT,
            status: UserStatus.ACTIVE,
            emailVerified: false,
            patient: {
                create: { firstName,lastName,phone },
            },
        },
        omit: { password: true },
        include: { patient: true },
    })

    const { patient, ...user } = createdUser
    const jwtPayload = {
        userId: user.id,
        firstName: patient?.firstName,
        lastName: patient?.lastName,
        email: user.email,
        role: user.role
    }

    const accessToken = jwtUtils.createToken(
        jwtPayload,
        config.jwt_access_secret,
        config.jwt_access_expires_in as SignOptions
    );

    const refreshToken = jwtUtils.createToken(
        jwtPayload,
        config.jwt_refresh_secret,
        config.jwt_refresh_expires_in as SignOptions
    );

    return {
        user,
        patient,
        accessToken,
        refreshToken
    }
}

const loginUser = async (payload: ILoginUserPayload) => {
    const { password } = payload
    const email = payload.email.trim().toLowerCase()

    const user = await prisma.user.findUnique({
        where: { email },
        include: { patient: true, driver: true },
    })

    if (!user) {
        throw new Error('User not found')
    }

    if (user.status === UserStatus.BLOCKED) {
        throw new Error('User is blocked')
    }

    if (user.isDeleted || user.status === UserStatus.DELETED) {
        throw new Error('User is deleted')
    }

    const isPasswordMatched = await bcrypt.compare(password, user.password)

    if (!isPasswordMatched) {
        throw new Error('Invalid credentials')
    }

   const jwtPayload = {
        userId: user.id,
        firstName: user.patient?.firstName || user.driver?.firstName,
        lastName: user.patient?.lastName || user.driver?.lastName,
        email: user.email,
        role: user.role
    }

    const accessToken = jwtUtils.createToken(
        jwtPayload,
        config.jwt_access_secret,
        config.jwt_access_expires_in as SignOptions
    );

    const refreshToken = jwtUtils.createToken(
        jwtPayload,
        config.jwt_refresh_secret,
        config.jwt_refresh_expires_in as SignOptions
    );

    return {
        accessToken,
        refreshToken
    }
}


export const AuthService = {
    registerPatient,
    loginUser
}