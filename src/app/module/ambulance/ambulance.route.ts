import { Router } from "express";
import { ambulanceController } from "./ambulance.controller";
import { createAmbulanceSchema, getAmbulanceByIdSchema, getAmbulancesQuerySchema } from "./ambulance.validation";
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

export const ambulanceRouter = router;