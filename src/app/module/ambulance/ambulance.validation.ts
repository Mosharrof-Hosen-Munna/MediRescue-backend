import { z } from "zod";
import { AmbulanceStatus } from "../../../generated/prisma/enums";

export const createAmbulanceSchema = z.object({
	body: z.object({
		registrationNo: z
			.string()
			.min(3, "Registration number must be at least 3 characters")
			.max(30, "Registration number must not exceed 30 characters")
			.trim(),

		model: z
			.string()
			.min(2, "Model must be at least 2 characters")
			.max(100, "Model must not exceed 100 characters")
			.trim(),

		manufacturer: z
			.string()
			.max(100, "Manufacturer must not exceed 100 characters")
			.trim()
			.optional(),

		year: z
			.number()
			.int("Year must be an integer")
			.min(1900, "Invalid manufacturing year")
			.max(new Date().getFullYear(), "Year cannot be in the future")
			.optional(),

		capacity: z
			.number()
			.int("Capacity must be an integer")
			.positive("Capacity must be greater than 0")
			.optional(),

		typeId: z.string().uuid("Invalid ambulance type ID"),

		driverId: z.string().uuid("Invalid driver ID").optional(),
	}),
});

export const getAmbulancesQuerySchema = z.object({
	query: z.object({
		page: z.coerce.number().int().min(1).default(1),

		limit: z.coerce.number().int().min(1).max(100).default(10),

		status: z.nativeEnum(AmbulanceStatus).optional(),

		typeId: z.string().uuid("Invalid ambulance type ID").optional(),

		search: z.string().trim().optional(),
	}),
});

export const getAmbulanceByIdSchema = z.object({
	params: z.object({
		id: z.string().uuid("Invalid ambulance ID"),
	}),
});

export const updateAmbulanceSchema = z.object({
	body: z.object({
		registrationNo: z
			.string()
			.min(3, "Registration number must be at least 3 characters")
			.max(30, "Registration number must not exceed 30 characters")
			.trim()
			.optional(),

		model: z
			.string()
			.min(2, "Model must be at least 2 characters")
			.max(100, "Model must not exceed 100 characters")
			.trim()
			.optional(),

		manufacturer: z
			.string()
			.max(100, "Manufacturer must not exceed 100 characters")
			.trim()
			.optional(),

		year: z
			.number()
			.int("Year must be an integer")
			.min(1900, "Invalid manufacturing year")
			.max(new Date().getFullYear(), "Invalid manufacturing year")
			.optional(),

		capacity: z
			.number()
			.int("Capacity must be an integer")
			.positive("Capacity must be greater than 0")
			.optional(),

		typeId: z.string().uuid("Invalid ambulance type ID").optional(),
	}),

	params: z.object({
		id: z.string().uuid("Invalid ambulance ID"),
	}),
});

export const deleteAmbulanceSchema = z.object({
	params: z.object({
		id: z.string().uuid("Invalid ambulance ID"),
	}),
});
export const updateAmbulanceStatusSchema = z.object({
	params: z.object({
		id: z.string().uuid("Invalid ambulance ID"),
	}),

	body: z.object({
		status: z.nativeEnum(AmbulanceStatus),
	}),
});

export const updateAmbulanceDriverSchema = z.object({
	params: z.object({
		id: z.string().uuid("Invalid ambulance ID"),
	}),

	body: z.object({
		driverId: z.string().uuid("Invalid driver ID").nullable().optional(),
	}),
});
