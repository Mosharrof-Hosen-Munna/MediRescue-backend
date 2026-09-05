import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { driverService } from "./driver.service";

const getAllDrivers = catchAsync(
    async (req: Request, res: Response) => {
        const result =
            await driverService.getAllDrivers(
                req.query
            );

        sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: "Drivers retrieved successfully",
            data: result.data,
            meta: result.meta,
        });
    }
);

const createDriver = catchAsync(
    async (req: Request, res: Response) => {
        const result = await driverService.createDriver(
            req.body,
            req.user.userId 
        );

        sendResponse(res, {
            statusCode: httpStatus.CREATED,
            success: true,
            message: "Driver created successfully",
            data: result,
        });
    }
);

export const driverController = {
    getAllDrivers,
    createDriver
};