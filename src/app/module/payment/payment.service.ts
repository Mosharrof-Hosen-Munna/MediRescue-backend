import Stripe from "stripe";
import { PaymentStatus } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { stripe } from "../../lib/stripe";
import { ICreateCheckoutPayload } from "./payment.interface";

const createCheckoutSession = async (payload: ICreateCheckoutPayload) => {
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
      ambulance: {
        select: {
          type: true,
        },
      },
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
    throw new Error("Payment is only available for completed dispatches");
  }

  if (dispatch.payment) {
    if (dispatch.payment.status === PaymentStatus.SUCCESS) {
      throw new Error("Payment has already been completed");
    }

    // if (dispatch.payment.providerSessionId) {
    //   const existingSession = await stripe.checkout.sessions.retrieve(
    //     dispatch.payment.providerSessionId,
    //   );

    //   return {
    //     payment: dispatch.payment,
    //     checkoutUrl: existingSession.url,
    //     message: "Checkout session already exists",
    //   };
    // }
  }

  const amount = Number(dispatch.ambulance.type.baseFare);
  console.log(amount);
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
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      },
    ],

    metadata: {
      paymentId: payment.id,
      paymentNumber: payment.paymentNumber,
      dispatchId: dispatch.id,
      emergencyRequestId: dispatch.emergencyRequestId,
    },

    success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,

    cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
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

const handleStripeWebhook = async (payload: Buffer, signature: string) => {
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, endpointSecret);
  } catch (err: any) {
    throw new Error(`Webhook Signature Verification Failed: ${err.message}`);
  }
  switch (event.type) {
      case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;

          const paymentId = session.metadata?.paymentId;

          if (!paymentId) {
              throw new Error(
                  "Payment ID not found in Stripe session metadata"
              );
          }

          const payment = await prisma.payment.findUnique({
              where: {
                  id: paymentId,
              },
          });

          if (!payment) {
              throw new Error("Payment not found");
          }

          // Webhooks can be delivered more than once.
          if (payment.status === PaymentStatus.SUCCESS) {
              return payment;
          }

          const updatedPayment = await prisma.payment.update({
              where: {
                  id: payment.id,
              },
              data: {
                  status: PaymentStatus.SUCCESS,
                  transactionId:
                      session.payment_intent?.toString() ?? null,
                  providerPaymentId: session.payment_intent
                      ?.toString(),
                  paidAt: new Date(),
                  failureReason: null,
              },
          });

          return updatedPayment;
      }

      case "checkout.session.expired": {
          const session = event.data.object as Stripe.Checkout.Session;

          const paymentId = session.metadata?.paymentId;

          if (!paymentId) {
              return;
          }

          await prisma.payment.updateMany({
              where: {
                  id: paymentId,
                  status: {
                      not: PaymentStatus.SUCCESS,
                  },
              },
              data: {
                  status: PaymentStatus.FAILED,
                  failureReason: "Stripe checkout session expired",
              },
          });

          return;
      }

      default:
          return;
  }
};

export const paymentService = {
  createCheckoutSession,
  handleStripeWebhook,
};
