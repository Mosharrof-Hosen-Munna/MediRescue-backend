import type { Request, Response } from "express";
import httpStatus from "http-status";

import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { emergencyRequestService } from "./emergencyRequest.service";
import type { ICancelEmergencyRequestPayload } from "./emergencyRequest.interface";

const createEmergencyRequest = catchAsync(
	async (req: Request, res: Response) => {
		const userId = req.user?.userId as string;

		console.log(req.body)

		const result = await emergencyRequestService.createEmergencyRequest(
			userId,
			req.body,
		);

		sendResponse(res, {
			statusCode: httpStatus.CREATED,
			success: true,
			message: "Emergency request created successfully",
			data: result,
		});
	},
);
const getAllEmergencyRequests = catchAsync(
	async (req: Request, res: Response) => {
		const result = await emergencyRequestService.getAllEmergencyRequests(
			req.query,
		);

		sendResponse(res, {
			statusCode: httpStatus.OK,
			success: true,
			message: "Emergency requests retrieved successfully",
			data: result.data,
			meta: result.meta,
		});
	},
);
const getEmergencyRequestById = catchAsync(
	async (req: Request, res: Response) => {
		const userRole = req.user?.role;
		const userId = req.user?.userId;
		const id = req.params.id;

		const result = await emergencyRequestService.getEmergencyRequestById(
			id as string,
			userId as string,
			userRole as string,
		);

		sendResponse(res, {
			statusCode: httpStatus.OK,
			success: true,
			message: "Emergency request retrieved successfully",
			data: result,
		});
	},
);
const updateEmergencyRequest = catchAsync(
	async (req: Request, res: Response) => {
		const result = await emergencyRequestService.updateEmergencyRequest(
			req.params.id as string,
			req.user.userId,
			req.user.role,
			req.body,
		);

		sendResponse(res, {
			statusCode: httpStatus.OK,
			success: true,
			message: "Emergency request updated successfully",
			data: result,
		});
	},
);

const cancelEmergencyRequest = catchAsync(
	async (req: Request, res: Response) => {
		const result = await emergencyRequestService.cancelEmergencyRequest(
			req.params.id as string,
			req.user.userId as string,
			req.user?.role as "ADMIN" | "PATIENT",
			req.body as ICancelEmergencyRequestPayload,
		);

		sendResponse(res, {
			statusCode: httpStatus.OK,
			success: true,
			message: "Emergency request cancelled successfully",
			data: result,
		});
	},
);

const getMyEmergencyRequests = catchAsync(
	async (req: Request, res: Response) => {
		const result = await emergencyRequestService.getMyEmergencyRequests(
			req.user.userId,
			req.query,
		);

		sendResponse(res, {
			statusCode: httpStatus.OK,
			success: true,
			message: "My emergency requests retrieved successfully",
			data: result.data,
			meta: result.meta,
		});
	},
);

export const emergencyRequestController = {
	createEmergencyRequest,
	getAllEmergencyRequests,
	getEmergencyRequestById,
	updateEmergencyRequest,
	cancelEmergencyRequest,
	getMyEmergencyRequests,
};
