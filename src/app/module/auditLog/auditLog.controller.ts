import  httpStatus  from 'http-status';
import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { IGetAuditLogsQuery } from "./auditLog.interface";
import { auditLogService } from "./auditLog.service";
import { sendResponse } from "../../utils/sendResponse";

const getAllAuditLogs = catchAsync(
	async (req: Request, res: Response) => {
		const result = await auditLogService.getAllAuditLogs(
			req.query as unknown as IGetAuditLogsQuery,
		);

		sendResponse(res, {
			statusCode: httpStatus.OK,
			success: true,
			message: "Audit logs retrieved successfully",
			data: result.data,
			meta: result.meta,
		});
	},
);

export const auditLogController = {
    getAllAuditLogs,
};