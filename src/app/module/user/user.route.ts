import { Router } from "express";
import { auth } from "../../middleware/authCheck";
import { userController } from "./user.controller";
import { Role } from "../../../generated/prisma/enums";
import { getUsersQuerySchema, updateMyProfileSchema } from "./user.validation";
import { validateRequest } from "../../middleware/validateRequest";

const router = Router()
router.get(
    "/me",
    auth(Role.ADMIN, Role.DRIVER, Role.PATIENT),
    userController.getMyProfile
);
router.get(
    "/",
    auth(Role.ADMIN),
    validateRequest(getUsersQuerySchema),
    userController.getUsers
);
router.patch(
    "/me",
    auth(Role.ADMIN, Role.DRIVER, Role.PATIENT),
    validateRequest(updateMyProfileSchema),
    userController.updateMyProfile
);

export const userRouter = router