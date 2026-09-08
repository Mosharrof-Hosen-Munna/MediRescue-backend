import { z } from "zod";

export const createAmbulanceTypeSchema = z.object({
	body: z.object({
		name: z
			.string()
			.min(2, "Ambulance type name must be at least 2 characters")
			.max(100, "Ambulance type name must not exceed 100 characters")
			.trim(),

		description: z
			.string()
			.max(500, "Description must not exceed 500 characters")
			.trim()
			.optional(),

		baseFare: z.number().positive("Base fare must be greater than 0"),
	}),
});

export const getAmbulanceTypesSchema = z.object({
	query: z.object({
		page: z.string().optional(),
		limit: z.string().optional(),
		search: z.string().trim().optional(),
		isActive: z.enum(["true", "false"]).optional(),
	}),
});

export const getAmbulanceTypeByIdSchema = z.object({
	params: z.object({
		id: z.string().uuid("Invalid ambulance type ID"),
	}),
});

export const updateAmbulanceTypeSchema = z.object({
	params: z.object({
		id: z.string().uuid("Invalid ambulance type ID"),
	}),
	body: z.object({
		name: z
			.string()
			.min(2, "Ambulance type name must be at least 2 characters")
			.max(100, "Ambulance type name must not exceed 100 characters")
			.trim()
			.optional(),

		description: z
			.string()
			.max(500, "Description must not exceed 500 characters")
			.trim()
			.optional(),

		baseFare: z
			.number()
			.positive("Base fare must be greater than 0")
			.optional(),

		isActive: z.boolean().optional(),
	}),
});

export const deleteAmbulanceTypeSchema = z.object({
	params: z.object({
		id: z.string().uuid("Invalid ambulance type ID"),
	}),
});
