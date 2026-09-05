import { Router } from "express";
import { driverController } from "./driver.controller";
import { createDriverSchema, getDriverByIdSchema, getDriversQuerySchema } from "./driver.validation";
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
router.get(
    "/:id",
    auth(Role.ADMIN, Role.DRIVER),
    validateRequest(getDriverByIdSchema),
    driverController.getDriverById
);
router.post(
    "/",
    auth(Role.ADMIN),
    validateRequest(createDriverSchema),
    driverController.createDriver
);



export const driverRouter = router;