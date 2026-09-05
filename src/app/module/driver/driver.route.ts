import { Router } from "express";
import { driverController } from "./driver.controller";
import { createDriverSchema, getDriversQuerySchema } from "./driver.validation";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/authCheck";
import { validateRequest } from "../../middleware/validateRequest";

const router = Router();

router.get(
    "/",
    auth(Role.ADMIN),
    validateRequest(getDriversQuerySchema),
    driverController.getAllDrivers
);
router.post(
    "/",
    auth(Role.ADMIN),
    validateRequest(createDriverSchema),
    driverController.createDriver
);


export const driverRouter = router;