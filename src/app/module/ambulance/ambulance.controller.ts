import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { ambulanceService } from "./ambulance.service";

const createAmbulance = catchAsync(async (req: Request, res: Response) => {
	const result = await ambulanceService.createAmbulance(req.body);

	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message: "Ambulance created successfully",
		data: result,
	});
});

const getAllAmbulances = catchAsync(async (req: Request, res: Response) => {
	const result = await ambulanceService.getAllAmbulances(req.query);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Ambulances retrieved successfully",
		data: result.data,
		meta: result.meta,
	});
});

const getAmbulanceById = catchAsync(async (req: Request, res: Response) => {
	const result = await ambulanceService.getAmbulanceById(
		req.params.id as string,
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Ambulance retrieved successfully",
		data: result,
	});
});

const updateAmbulance = catchAsync(async (req: Request, res: Response) => {
	const result = await ambulanceService.updateAmbulance(
		req.params.id as string,
		req.body,
		req.user.userId,
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Ambulance updated successfully",
		data: result,
	});
});

const deleteAmbulance = catchAsync(async (req: Request, res: Response) => {
	const result = await ambulanceService.deleteAmbulance(
		req.params.id as string,
		req.user.userId,
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Ambulance deleted successfully",
		data: result,
	});
});
const updateAmbulanceStatus = catchAsync(
	async (req: Request, res: Response) => {
		const result = await ambulanceService.updateAmbulanceStatus(
			req.user.userId,
			req.params.id as string,
			req.body.status,
		);

		sendResponse(res, {
			statusCode: httpStatus.OK,
			success: true,
			message: "Ambulance status updated successfully",
			data: result,
		});
	},
);

const updateAmbulanceDriver = catchAsync(
	async (req: Request, res: Response) => {
		const result = await ambulanceService.updateAmbulanceDriver(
			req.params.id as string,
			req.body.driverId,
			req.user.userId,
		);

		sendResponse(res, {
			statusCode: httpStatus.OK,
			success: true,
			message: req.body.driverId
				? "Driver assigned to ambulance successfully"
				: "Driver removed from ambulance successfully",
			data: result,
		});
	},
);
export const ambulanceController = {
	createAmbulance,
	getAllAmbulances,
	getAmbulanceById,
	updateAmbulance,
	deleteAmbulance,
	updateAmbulanceStatus,
	updateAmbulanceDriver,
};
