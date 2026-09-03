import { Request, Response } from "express";
import httpStatus from "http-status";

import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { serviceTypeService } from "./serviceType.service";

const createServiceType = catchAsync(
    async (req: Request, res: Response) => {
        const result = await serviceTypeService.createServiceType(
            req.body
        );

        sendResponse(res, {
            statusCode: httpStatus.CREATED,
            success: true,
            message: "Service type created successfully",
            data: result,
        });
    }
);

export const serviceTypeController = {
    createServiceType,
};