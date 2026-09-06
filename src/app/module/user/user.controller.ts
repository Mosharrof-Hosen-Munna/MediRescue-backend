import httpStatus  from 'http-status';
import { sendResponse } from "../../utils/sendResponse";
import { catchAsync } from '../../utils/catchAsync';
import { userService } from './user.service';
import { Request, Response } from 'express';
import { IGetUsersQuery } from './user.interface';

const getMyProfile = catchAsync(
    async (req: Request, res: Response) => {
        const result = await userService.getMyProfile(
            req.user.userId
        );

        sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: "User profile retrieved successfully",
            data: result,
        });
    }
);

const updateMyProfile = catchAsync(
    async (req: Request, res: Response) => {
        const result = await userService.updateMyProfile(
            req.user.userId,
            req.body
        );

        sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: "User profile updated successfully",
            data: result,
        });
    }
);

const getUsers = catchAsync(
    async (req: Request, res: Response) => {
        const result = await userService.getUsers(
            req.query as IGetUsersQuery
        );

        sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: "Users retrieved successfully",
            data: result.data,
            meta: result.meta,
        });
    }
);

export const userController = {
    getMyProfile,
    updateMyProfile,
    getUsers
};