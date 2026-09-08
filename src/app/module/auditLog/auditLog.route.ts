import { Router } from "express";
import { auth } from "../../middleware/authCheck";
import { validateRequest } from "../../middleware/validateRequest";
import { auditLogController } from "./auditLog.controller";
import { getAuditLogsQuerySchema } from "./auditLog.validation";
import { Role } from "../../../generated/prisma/enums";

const router = Router()
router.get(
	"/",
	auth(Role.ADMIN),
	validateRequest(getAuditLogsQuerySchema),
	auditLogController.getAllAuditLogs,
);

export const auditLogRouter = router;