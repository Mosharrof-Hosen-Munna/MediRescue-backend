import { Request, Response } from "express";
import httpStatus from "http-status";

import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { ambulanceTypeService } from "./ambulanceType.service";

const createAmbulanceType = catchAsync(
    async (req: Request, res: Response) => {
        const result =
            await ambulanceTypeService.createAmbulanceType(
                req.body
            );

        sendResponse(res, {
            statusCode: httpStatus.CREATED,
            success: true,
            message: "Ambulance type created successfully",
            data: result,
        });
    }
);

export const ambulanceTypeController = {
    createAmbulanceType,
};