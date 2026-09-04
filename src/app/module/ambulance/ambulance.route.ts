import { Router } from "express";
import { ambulanceController } from "./ambulance.controller";
import { createAmbulanceSchema, getAmbulancesQuerySchema } from "./ambulance.validation";
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

export const ambulanceRouter = router;