import httpStatus from "http-status";
import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { patientService } from "./patient.service";

const getMyProfile = catchAsync(async (req: Request, res: Response) => {
	const result = await patientService.getMyProfile(req.user.userId);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Patient profile retrieved successfully",
		data: result,
	});
});

const updateMyProfile = catchAsync(async (req: Request, res: Response) => {
	const result = await patientService.updateMyProfile(
		req.user.userId,
		req.body,
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Patient profile updated successfully",
		data: result,
	});
});

const getPatientEmergencyRequests = catchAsync(
	async (req: Request, res: Response) => {
		const result = await patientService.getPatientEmergencyRequests(
			req.params.id as string,
			req.query,
		);

		sendResponse(res, {
			statusCode: httpStatus.OK,
			success: true,
			message: "Patient emergency requests retrieved successfully",
			data: result.data,
			meta: result.meta,
		});
	},
);

export const patientController = {
	getMyProfile,
	updateMyProfile,
	getPatientEmergencyRequests,
};
