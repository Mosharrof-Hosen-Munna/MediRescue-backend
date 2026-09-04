import { prisma } from "../../lib/prisma";
import { ICreateAmbulanceTypePayload } from "./ambulanceType.interface";

const createAmbulanceType = async (
    payload: ICreateAmbulanceTypePayload
) => {
    const {
        name,
        description,
        baseFare,
    } = payload;

    // Check if ambulance type already exists
    const existingAmbulanceType =
        await prisma.ambulanceType.findUnique({
            where: {
                name,
            },
        });

    if (existingAmbulanceType) {
        throw new Error("Ambulance type already exists");
    }

    // Create ambulance type
    const ambulanceType = await prisma.ambulanceType.create({
        data: {
            name,
            description,
            baseFare,
        },
    });

    return ambulanceType;
};

export const ambulanceTypeService = {
    createAmbulanceType,
};