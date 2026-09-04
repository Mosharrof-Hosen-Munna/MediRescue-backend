import { Request, Response } from "express";
import httpStatus from "http-status";

import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { emergencyRequestService } from "./emergencyRequest.service";
import { JwtPayload } from "jsonwebtoken";

const createEmergencyRequest = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId as string;

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

export const emergencyRequestController = {
  createEmergencyRequest,
  getAllEmergencyRequests,
  getEmergencyRequestById
};
