import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { driverService } from "./driver.service";

const getAllDrivers = catchAsync(async (req: Request, res: Response) => {
	const result = await driverService.getAllDrivers(req.query);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Drivers retrieved successfully",
		data: result.data,
		meta: result.meta,
	});
});

const createDriver = catchAsync(async (req: Request, res: Response) => {
	const result = await driverService.createDriver(req.body, req.user.userId);

	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message: "Driver created successfully",
		data: result,
	});
});

const getDriverById = catchAsync(async (req: Request, res: Response) => {
	const result = await driverService.getDriverById(
		req.params.id as string,
		req.user.userId,
		req.user.role,
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Driver retrieved successfully",
		data: result,
	});
});

const updateDriver = catchAsync(async (req: Request, res: Response) => {
	const result = await driverService.updateDriver(
		req.params.id as string,
		req.body,
		req.user.userId,
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Driver updated successfully",
		data: result,
	});
});

const deleteDriver = catchAsync(async (req: Request, res: Response) => {
	const result = await driverService.deleteDriver(
		req.params.id as string,
		req.user.userId,
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Driver deleted successfully",
		data: result,
	});
});

const getDriverDispatches = catchAsync(async (req: Request, res: Response) => {
	const result = await driverService.getDriverDispatches(
		req.params.id as string,
		req.query,
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Driver dispatches retrieved successfully",
		data: result.data,
		meta: result.meta,
	});
});

const getMyProfile = catchAsync(async (req: Request, res: Response) => {
	const result = await driverService.getMyProfile(req.user.userId);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Driver profile retrieved successfully",
		data: result,
	});
});

const getMyDispatches = catchAsync(async (req: Request, res: Response) => {
	const result = await driverService.getMyDispatches(
		req.user.userId,
		req.query,
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "My dispatches retrieved successfully",
		data: result.data,
		meta: result.meta,
	});
});

export const driverController = {
	getAllDrivers,
	createDriver,
	getDriverById,
	updateDriver,
	deleteDriver,
	getDriverDispatches,
	getMyProfile,
	getMyDispatches,
};
