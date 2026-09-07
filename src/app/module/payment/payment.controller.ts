import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { paymentService } from "./payment.service";

const createCheckoutSession = catchAsync(
    async (req: Request, res: Response) => {
        const result =
            await paymentService.createCheckoutSession({
                dispatchId: req.params.dispatchId as string,
                userId: req.user.userId,
            });

        sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: "Stripe checkout session created successfully",
            data: result,
        });
    }
);

export const paymentController = {
    createCheckoutSession,
};