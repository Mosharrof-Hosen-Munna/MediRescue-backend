import { Router } from "express";

import { emergencyRequestController } from "./emergencyRequest.controller";
import { createEmergencyRequestSchema } from "./emergencyRequest.validation";
import { validateRequest } from "../../middleware/validateRequest";
import { auth } from "../../middleware/authCheck";
import { Role } from "../../../generated/prisma/enums";

const router = Router();

router.post(
    "/",
    auth(Role.PATIENT),
    validateRequest(createEmergencyRequestSchema),
    emergencyRequestController.createEmergencyRequest
);

export const emergencyRequestRouter = router;