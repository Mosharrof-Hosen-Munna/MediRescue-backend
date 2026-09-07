
import { PaymentStatus } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { stripe } from "../../lib/stripe";
import { ICreateCheckoutPayload } from "./payment.interface";

const createCheckoutSession = async (
    payload: ICreateCheckoutPayload
) => {

    const dispatch = await prisma.dispatch.findUnique({
        where: {
            id: payload.dispatchId,
        },
        include: {
            emergencyRequest: {
                include: {
                    patient: {
                        select: {
                            id: true,
                            userId: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                },
            },
            payment: true,
            ambulance:{
                select:{
                    type:true
                }
            }
        },
    });

    if (!dispatch) {
        throw new Error("Dispatch not found");
    }

    // if (dispatch.emergencyRequest.patient.userId !== payload.userId) {
    //     throw new Error(
    //         "You are not allowed to pay for this dispatch"
    //     );
    // }

    if (dispatch.status !== "COMPLETED") {
        throw new Error(
            "Payment is only available for completed dispatches"
        );
    }

    if (dispatch.payment) {
        if (dispatch.payment.status === PaymentStatus.SUCCESS) {
            throw new Error("Payment has already been completed");
        }

        if (dispatch.payment.providerSessionId) {
            return {
                payment: dispatch.payment,
                checkoutUrl: null,
                message: "Checkout session already exists",
            };
        }
    }

    const amount = Number(dispatch.ambulance.type.baseFare); 
    console.log(amount)
    if (amount <= 0) {
        throw new Error("Invalid payment amount");
    }

    const paymentNumber = `PAY-${Date.now()}`;

    const payment = await prisma.payment.upsert({
        where: {
            dispatchId: dispatch.id,
        },
        update: {
            status: PaymentStatus.PROCESSING,
            failureReason: null,
        },
        create: {
            paymentNumber,
            dispatchId: dispatch.id,
            amount,
            currency: "BDT",
            method: "STRIPE",
            status: PaymentStatus.PROCESSING,
        },
    });

    const session = await stripe.checkout.sessions.create({
        mode: "payment",

        line_items: [
            {
                price_data: {
                    currency: "bdt",
                    product_data: {
                        name: `MediResque Ambulance Service - ${dispatch.emergencyRequest.requestNumber}`,
                    },
                    unit_amount: Math.round(amount*100),
                },
                quantity: 1,
            },
        ],

        metadata: {
            paymentId: payment.id,
            paymentNumber: payment.paymentNumber,
            dispatchId: dispatch.id,
            emergencyRequestId:
                dispatch.emergencyRequestId,
        },

        success_url:
            `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,

        cancel_url:
            `${process.env.FRONTEND_URL}/payment/cancel`,
    });

    await prisma.payment.update({
        where: {
            id: payment.id,
        },
        data: {
            providerSessionId: session.id,
            status: PaymentStatus.PROCESSING,
        },
    });

    return {
        paymentId: payment.id,
        paymentNumber: payment.paymentNumber,
        amount: payment.amount,
        currency: payment.currency,
        status: PaymentStatus.PROCESSING,
        checkoutUrl: session.url,
    };
};

export const paymentService = {
    createCheckoutSession,
};