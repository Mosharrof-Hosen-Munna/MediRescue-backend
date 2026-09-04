import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { ambulanceService } from "./ambulance.service";

const createAmbulance = catchAsync(
    async (req: Request, res: Response) => {
        const result = await ambulanceService.createAmbulance(
            req.body
        );

        sendResponse(res, {
            statusCode: httpStatus.CREATED,
            success: true,
            message: "Ambulance created successfully",
            data: result,
        });
    }
);

export const ambulanceController = {
    createAmbulance,
};