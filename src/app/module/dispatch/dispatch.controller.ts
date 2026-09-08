import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { dispatchService } from "./dispatch.service";
import type { DispatchAction } from "./dispatch.interface";

const createDispatch = catchAsync(async (req: Request, res: Response) => {
	const result = await dispatchService.createDispatch(
		req.user.userId,
		req.body,
	);

	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message: "Dispatch created successfully",
		data: result,
	});
});

const getDispatches = catchAsync(async (req: Request, res: Response) => {
	const result = await dispatchService.getDispatches(req.query);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Dispatches retrieved successfully",
		data: result.data,
		meta: result.meta,
	});
});

const getDispatchById = catchAsync(async (req: Request, res: Response) => {
	const result = await dispatchService.getDispatchById(req.params.id as string);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Dispatch retrieved successfully",
		data: result,
	});
});

const updateDispatch = catchAsync(async (req: Request, res: Response) => {
	const result = await dispatchService.updateDispatch(
		req.params.id as string,
		req.user.userId,
		req.body,
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Dispatch updated successfully",
		data: result,
	});
});
const updateDispatchAction = catchAsync(async (req: Request, res: Response) => {
	const result = await dispatchService.updateDispatchAction(req.user.userId, {
		id: req.params.id as string,
		status: req.params.status as DispatchAction,
		rejectionReason: req.body.rejectionReason,
	});

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message:
			req.params.status === "accept"
				? "Dispatch accepted successfully"
				: "Dispatch rejected successfully",
		data: result,
	});
});
const getMyDispatches = catchAsync(async (req: Request, res: Response) => {
	const result = await dispatchService.getMyDispatches(
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

export const dispatchController = {
	createDispatch,
	getDispatches,
	getDispatchById,
	updateDispatch,
	updateDispatchAction,
	getMyDispatches,
};
