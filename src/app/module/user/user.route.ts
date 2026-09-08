import { Router } from "express";
import { auth } from "../../middleware/authCheck";
import { userController } from "./user.controller";
import { Role } from "../../../generated/prisma/enums";
import {
	deleteUserSchema,
	getUserByIdSchema,
	getUsersQuerySchema,
	updateMyProfileSchema,
	updateUserStatusSchema,
} from "./user.validation";
import { validateRequest } from "../../middleware/validateRequest";
import { upload } from "../../lib/multer";

const router = Router();
router.get(
	"/me",
	auth(Role.ADMIN, Role.DRIVER, Role.PATIENT),
	userController.getMyProfile,
);
router.get(
	"/",
	auth(Role.ADMIN),
	validateRequest(getUsersQuerySchema),
	userController.getUsers,
);

router.get(
	"/:id",
	auth(Role.ADMIN),
	validateRequest(getUserByIdSchema),
	userController.getUserById,
);
router.patch(
	"/me",
	auth(Role.ADMIN, Role.DRIVER, Role.PATIENT),
	validateRequest(updateMyProfileSchema),
	userController.updateMyProfile,
);
router.patch('/profile-photo',upload.single("profilePhoto"), auth(Role.ADMIN, Role.DRIVER, Role.PATIENT), userController.updateProfilePhoto);

router.patch(
	"/:id/status",
	auth(Role.ADMIN),
	validateRequest(updateUserStatusSchema),
	userController.updateUserStatus,
);

router.delete(
	"/:id",
	auth(Role.ADMIN),
	validateRequest(deleteUserSchema),
	userController.deleteUser,
);

export const userRouter = router;
