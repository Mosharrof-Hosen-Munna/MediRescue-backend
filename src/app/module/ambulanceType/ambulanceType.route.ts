import { Router } from "express";

import { ambulanceTypeController } from "./ambulanceType.controller";
import { createAmbulanceTypeSchema, deleteAmbulanceTypeSchema, getAmbulanceTypeByIdSchema, getAmbulanceTypesSchema, updateAmbulanceTypeSchema } from "./ambulanceType.validation";
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
router.get(
    "/",
    auth(Role.ADMIN,Role.DRIVER, Role.PATIENT),
    validateRequest(getAmbulanceTypesSchema),
    ambulanceTypeController.getAmbulanceTypes
);

router.get(
    "/:id",
    auth(Role.ADMIN,Role.DRIVER, Role.PATIENT),
    validateRequest(getAmbulanceTypeByIdSchema),
    ambulanceTypeController.getAmbulanceTypeById
);

router.patch(
    "/:id",
    auth(Role.ADMIN),
    validateRequest(updateAmbulanceTypeSchema),
    ambulanceTypeController.updateAmbulanceType
);

router.delete(
    "/:id",
    auth(Role.ADMIN),
    validateRequest(deleteAmbulanceTypeSchema),
    ambulanceTypeController.deleteAmbulanceType
);

export const ambulanceTypeRouter = router;