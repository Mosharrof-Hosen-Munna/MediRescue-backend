import { Router } from "express";
import { auth } from "../../middleware/authCheck";
import { validateRequest } from "../../middleware/validateRequest";
import { createCheckoutSchema } from "./payment.validation";
import { paymentController } from "./payment.controller";

const router = Router();
router.post(
	"/checkout/:dispatchId",
	auth(),
	validateRequest(createCheckoutSchema),
	paymentController.createCheckoutSession,
);
router.post("/webhook", paymentController.stripeWebhook);

export const paymentRouter = router;
