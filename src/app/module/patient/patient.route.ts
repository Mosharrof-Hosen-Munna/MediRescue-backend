import { Router } from "express";
import { auth } from "../../middleware/authCheck";
import { patientController } from "./patient.controller";
import { Role } from "../../../generated/prisma/enums";
import {
	getPatientEmergencyRequestsSchema,
	updateMyPatientProfileSchema,
} from "./patient.validation";
import { validateRequest } from "../../middleware/validateRequest";

const router = Router();
router.get("/me", auth(Role.PATIENT), patientController.getMyProfile);
router.patch(
	"/me",
	auth(Role.PATIENT),
	validateRequest(updateMyPatientProfileSchema),
	patientController.updateMyProfile,
);

router.get(
	"/:id/emergency-requests",
	auth(Role.ADMIN),
	validateRequest(getPatientEmergencyRequestsSchema),
	patientController.getPatientEmergencyRequests,
);

export const patientRouter = router;
