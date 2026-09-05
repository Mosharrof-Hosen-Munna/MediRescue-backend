import { Router } from "express";
import { ambulanceController } from "./ambulance.controller";
import { createAmbulanceSchema, deleteAmbulanceSchema, getAmbulanceByIdSchema, getAmbulancesQuerySchema, updateAmbulanceSchema } from "./ambulance.validation";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/authCheck";
import { validateRequest } from "../../middleware/validateRequest";

const router = Router();

router.post(
    "/",
    auth(Role.ADMIN),
    validateRequest(createAmbulanceSchema),
    ambulanceController.createAmbulance
);

router.get(
    "/",
    auth(Role.ADMIN),
    validateRequest(getAmbulancesQuerySchema),
    ambulanceController.getAllAmbulances
);
router.get(
    "/:id",
    auth(Role.ADMIN),
    validateRequest(getAmbulanceByIdSchema),
    ambulanceController.getAmbulanceById
);

router.patch(
    "/:id",
    auth(Role.ADMIN),
    validateRequest(updateAmbulanceSchema),
    ambulanceController.updateAmbulance
);
router.patch(
    "/:id/status",
    auth(Role.ADMIN),
    validateRequest(updateAmbulanceSchema),
    ambulanceController.updateAmbulance
);

router.delete(
    "/:id",
    auth(Role.ADMIN),
    validateRequest(deleteAmbulanceSchema),
    ambulanceController.deleteAmbulance
);

export const ambulanceRouter = router;