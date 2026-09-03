import { Request, Response } from "express";
import httpStatus from "http-status";

import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { emergencyRequestService } from "./emergencyRequest.service";

const createEmergencyRequest = catchAsync(
    async (req: Request, res: Response) => {
        const userId = req.user?.userId as string;

        const result =
            await emergencyRequestService.createEmergencyRequest(
                userId,
                req.body
            );

        sendResponse(res, {
            statusCode: httpStatus.CREATED,
            success: true,
            message: "Emergency request created successfully",
            data: result,
        });
    }
);

export const emergencyRequestController = {
    createEmergencyRequest,
};