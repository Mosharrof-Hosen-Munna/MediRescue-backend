import { Router } from "express";
import { serviceTypeController } from "./serviceType.controller";
import {
	createServiceTypeSchema,
	getServiceTypesQuerySchema,
} from "./serviceType.validation";
import { auth } from "../../middleware/authCheck";
import { validateRequest } from "../../middleware/validateRequest";
import { Role } from "../../../generated/prisma/enums";

const router = Router();

router.get(
	"/",
	auth("PATIENT", "ADMIN"),
	validateRequest(getServiceTypesQuerySchema),
	serviceTypeController.getAllServiceTypes,
);
router.post(
	"/",
	auth(Role.ADMIN),
	validateRequest(createServiceTypeSchema),
	serviceTypeController.createServiceType,
);

export const serviceTypeRouter = router;
