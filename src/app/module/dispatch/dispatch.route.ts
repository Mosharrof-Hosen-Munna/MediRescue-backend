import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/authCheck";
import { validateRequest } from "../../middleware/validateRequest";
import { dispatchController } from "./dispatch.controller";
import {
	createDispatchSchema,
	getDispatchByIdSchema,
	getDispatchesSchema,
	getMyDispatchesSchema,
	updateDispatchActionSchema,
	updateDispatchSchema,
} from "./dispatch.validation";

const router = Router();

router.get(
	"/",
	auth(Role.ADMIN),
	validateRequest(getDispatchesSchema),
	dispatchController.getDispatches,
);
router.post(
	"/",
	auth(Role.ADMIN),
	validateRequest(createDispatchSchema),
	dispatchController.createDispatch,
);
router.get(
	"/my-dispatches",
	auth(Role.DRIVER),
	validateRequest(getMyDispatchesSchema),
	dispatchController.getMyDispatches,
);

router.get(
	"/:id",
	auth(Role.ADMIN),
	validateRequest(getDispatchByIdSchema),
	dispatchController.getDispatchById,
);

router.patch(
	"/:id",
	auth(Role.ADMIN),
	validateRequest(updateDispatchSchema),
	dispatchController.updateDispatch,
);

router.post(
	"/:id/:status",
	auth(Role.DRIVER),
	validateRequest(updateDispatchActionSchema),
	dispatchController.updateDispatchAction,
);

export const dispatchRouter = router;
