import { Request, Response } from 'express';
import { AuthService } from "./auth.service"
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import  httpStatus  from 'http-status';

const registerPatient = catchAsync(async (req: Request, res: Response) => {
    const payload = req.body
    const result = await AuthService.registerPatient(payload)

    const { accessToken, refreshToken, user, patient } = result

    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: false,
        sameSite: "none",
        maxAge: 1000 * 60 * 60 * 24 // 24 hour or 1 day
    })
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: "none",
        maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
    })

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: 'Patient registered successfully',
        data: {
            accessToken,
            refreshToken,
            user,
            patient,
        },
    })
})

export const AuthController = {
    registerPatient
}