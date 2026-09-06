import { Request, Response } from "express";
import httpStatus from "http-status";

import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { ambulanceTypeService } from "./ambulanceType.service";

const createAmbulanceType = catchAsync(
    async (req: Request, res: Response) => {
        const result =
            await ambulanceTypeService.createAmbulanceType(
                req.body
            );

        sendResponse(res, {
            statusCode: httpStatus.CREATED,
            success: true,
            message: "Ambulance type created successfully",
            data: result,
        });
    }
);

const getAmbulanceTypes = catchAsync(
    async (req: Request, res: Response) => {
        const result = await ambulanceTypeService.getAmbulanceTypes(
            req.query
        );

        sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: "Ambulance types retrieved successfully",
            data: result.data,
            meta: result.meta,
        });
    }
);

const getAmbulanceTypeById = catchAsync(
    async (req: Request, res: Response) => {
        const result = await ambulanceTypeService.getAmbulanceTypeById(
            req.params.id as string
        );

        sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: "Ambulance type retrieved successfully",
            data: result,
        });
    }
);
const updateAmbulanceType = catchAsync(
    async (req: Request, res: Response) => {
        const result = await ambulanceTypeService.updateAmbulanceType(
            req.params.id as string,
            req.body,
            req.user.userId
        );

        sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: "Ambulance type updated successfully",
            data: result,
        });
    }
);

const deleteAmbulanceType = catchAsync(
    async (req: Request, res: Response) => {
        const result = await ambulanceTypeService.deleteAmbulanceType(
            req.params.id as string,
            req.user.userId
        );

        sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: "Ambulance type deleted successfully",
            data: result,
        });
    }
);

export const ambulanceTypeController = {
    createAmbulanceType,
    getAmbulanceTypes,
    getAmbulanceTypeById,
    updateAmbulanceType,
    deleteAmbulanceType
};