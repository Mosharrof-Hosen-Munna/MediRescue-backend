import { Router } from "express";

import { emergencyRequestController } from "./emergencyRequest.controller";
import { cancelEmergencyRequestSchema, createEmergencyRequestSchema, getEmergencyRequestByIdSchema, getEmergencyRequestsQuerySchema, getMyEmergencyRequestsSchema, updateEmergencyRequestSchema } from "./emergencyRequest.validation";
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
router.get(
    "/",
    auth(Role.ADMIN),
    validateRequest(getEmergencyRequestsQuerySchema),
    emergencyRequestController.getAllEmergencyRequests
);

router.get(
    "/:id",
    auth(Role.PATIENT, Role.ADMIN),
    validateRequest(getEmergencyRequestByIdSchema),
    emergencyRequestController.getEmergencyRequestById
);

router.patch(
    "/:id",
    auth(Role.PATIENT, Role.ADMIN),
    validateRequest(updateEmergencyRequestSchema),
    emergencyRequestController.updateEmergencyRequest
);

router.patch(
    "/:id/cancel",
    auth(Role.PATIENT, Role.ADMIN),
    validateRequest(cancelEmergencyRequestSchema),
    emergencyRequestController.cancelEmergencyRequest
);

router.get(
    "/my-requests",
    auth(Role.PATIENT),
    validateRequest(getMyEmergencyRequestsSchema),
    emergencyRequestController.getMyEmergencyRequests
);

export const emergencyRequestRouter = router;