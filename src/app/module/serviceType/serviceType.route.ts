import { Router } from "express";
import { serviceTypeController } from "./serviceType.controller";
import { createServiceTypeSchema } from "./serviceType.validation";
import { auth } from "../../middleware/authCheck";
import { validateRequest } from "../../middleware/validateRequest";
import { Role } from "../../../generated/prisma/enums";

const router = Router();

router.post(
    "/",
    auth(Role.ADMIN),
    validateRequest(createServiceTypeSchema),
    serviceTypeController.createServiceType
);

export const serviceTypeRouter = router;