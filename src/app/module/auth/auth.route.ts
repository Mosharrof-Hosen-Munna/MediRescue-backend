import { Router } from "express";
import { AuthController } from "./auth.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { AuthValidation } from "./auth.validation";
import { auth } from "../../middleware/authCheck";
import { Role } from "../../../generated/prisma/enums";

const router = Router();
router.post(
	"/register",
	validateRequest(AuthValidation.registerPatientSchema),
	AuthController.registerPatient,
);
router.post(
	"/login",
	validateRequest(AuthValidation.loginUserSchema),
	AuthController.loginUser,
);
router.post("/google", AuthController.googleLogin);
router.get(
	"/me",
	auth(Role.ADMIN, Role.DRIVER, Role.PATIENT),
	AuthController.getMe,
);

export const AuthRoutes = router;
