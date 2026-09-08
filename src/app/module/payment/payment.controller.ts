import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { paymentService } from "./payment.service";
import { stripe } from "../../lib/stripe";

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

const stripeWebhook = catchAsync(
    async (req: Request, res: Response) => {
      console.log(
            "Body is Buffer:",
            Buffer.isBuffer(req.body)
        );

        console.log(
            "Stripe Signature:",
            req.headers["stripe-signature"]
        );

        console.log(
            "Webhook Secret Exists:",
            Boolean(process.env.STRIPE_WEBHOOK_SECRET)
        );
         let event = req.body as Buffer;
    const signature = req.headers["stripe-signature"]!;
    

        if (!signature) {
            throw new Error(
                "Stripe signature is missing"
            );
        }



        await paymentService.handleStripeWebhook(event, signature as string);

        sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: "Stripe webhook processed successfully",
            data: null,
        });
    }
);

export const paymentController = {
    createCheckoutSession,
    stripeWebhook
};