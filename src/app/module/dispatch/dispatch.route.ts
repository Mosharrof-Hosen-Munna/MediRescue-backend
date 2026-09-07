import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/authCheck";
import { validateRequest } from "../../middleware/validateRequest";
import { dispatchController } from "./dispatch.controller";
import { createDispatchSchema } from "./dispatch.validation";
const router = Router()
router.post(
    "/",
    auth(Role.ADMIN),
    validateRequest(createDispatchSchema),
    dispatchController.createDispatch
);

export const dispatchRouter = router