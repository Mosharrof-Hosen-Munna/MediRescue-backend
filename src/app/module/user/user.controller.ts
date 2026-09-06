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

const getUserById = catchAsync(
    async (req: Request, res: Response) => {
        const result = await userService.getUserById(
            req.params.id as string
        );

        sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: "User retrieved successfully",
            data: result,
        });
    }
);

const updateUserStatus = catchAsync(
    async (req: Request, res: Response) => {
        const result = await userService.updateUserStatus(
            req.params.id as string,
            req.body.status,
            req.user.userId
        );

        sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: "User status updated successfully",
            data: result,
        });
    }
);

const deleteUser = catchAsync(
    async (req: Request, res: Response) => {
        const result = await userService.deleteUser(
            req.params.id as string,
            req.user.userId
        );

        sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: "User deleted successfully",
            data: result,
        });
    }
);

export const userController = {
    getMyProfile,
    updateMyProfile,
    getUsers,
    getUserById,
    updateUserStatus,
    deleteUser
};