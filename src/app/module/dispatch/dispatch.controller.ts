import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { dispatchService } from "./dispatch.service";

const createDispatch = catchAsync(
    async (req: Request, res: Response) => {
        const result =
            await dispatchService.createDispatch(
                req.user.userId,
                req.body
            );

        sendResponse(res, {
            statusCode: httpStatus.CREATED,
            success: true,
            message: "Dispatch created successfully",
            data: result,
        });
    }
);

export const dispatchController = {
    createDispatch,
};