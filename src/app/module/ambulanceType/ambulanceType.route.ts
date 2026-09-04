import { Router } from "express";

import { ambulanceTypeController } from "./ambulanceType.controller";
import { createAmbulanceTypeSchema } from "./ambulanceType.validation";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/authCheck";
import { validateRequest } from "../../middleware/validateRequest";

const router = Router();

router.post(
    "/",
    auth(Role.ADMIN),
    validateRequest(createAmbulanceTypeSchema),
    ambulanceTypeController.createAmbulanceType
);

export const ambulanceTypeRouter = router;