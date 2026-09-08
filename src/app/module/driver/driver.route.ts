import { Router } from "express";
import { driverController } from "./driver.controller";
import {
	createDriverSchema,
	deleteDriverSchema,
	getDriverByIdSchema,
	getDriverDispatchesSchema,
	getDriversQuerySchema,
	getMyDispatchesSchema,
	updateDriverSchema,
} from "./driver.validation";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/authCheck";
import { validateRequest } from "../../middleware/validateRequest";

const router = Router();

router.get(
	"/",
	auth(Role.ADMIN),
	validateRequest(getDriversQuerySchema),
	driverController.getAllDrivers,
);
router.get(
	"/:id",
	auth(Role.ADMIN, Role.DRIVER),
	validateRequest(getDriverByIdSchema),
	driverController.getDriverById,
);

router.get("/me", auth(Role.DRIVER), driverController.getMyProfile);

router.get(
	"/:id/dispatches",
	auth(Role.ADMIN),
	validateRequest(getDriverDispatchesSchema),
	driverController.getDriverDispatches,
);
router.post(
	"/",
	auth(Role.ADMIN),
	validateRequest(createDriverSchema),
	driverController.createDriver,
);

router.patch(
	"/:id",
	auth(Role.ADMIN),
	validateRequest(updateDriverSchema),
	driverController.updateDriver,
);

router.delete(
	"/:id",
	auth(Role.ADMIN),
	validateRequest(deleteDriverSchema),
	driverController.deleteDriver,
);

router.get(
	"/me/dispatches",
	auth(Role.DRIVER),
	validateRequest(getMyDispatchesSchema),
	driverController.getMyDispatches,
);

export const driverRouter = router;
