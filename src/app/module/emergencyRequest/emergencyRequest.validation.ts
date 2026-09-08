import { z } from "zod";

import { EmergencyRequestStatus } from "../../../generated/prisma/enums";

export const createEmergencyRequestSchema = z.object({
	body: z.object({
		serviceTypeId: z.string().uuid("Invalid service type ID"),

		ambulanceTypeId: z.string().uuid("Invalid ambulance type ID"),

		pickupAddress: z
			.string()
			.min(5, "Pickup address must be at least 5 characters")
			.max(500, "Pickup address must not exceed 500 characters")
			.trim(),

		emergencyDescription: z
			.string()
			.max(1000, "Emergency description must not exceed 1000 characters")
			.trim()
			.optional(),

		patientCondition: z
			.string()
			.max(500, "Patient condition must not exceed 500 characters")
			.trim()
			.optional(),

		additionalNotes: z
			.string()
			.max(1000, "Additional notes must not exceed 1000 characters")
			.trim()
			.optional(),
	}),
});

export const getEmergencyRequestsQuerySchema = z.object({
	query: z.object({
		page: z.coerce.number().int().min(1).default(1),

		limit: z.coerce.number().int().min(1).max(100).default(10),

		status: z.nativeEnum(EmergencyRequestStatus).optional(),

		serviceTypeId: z.string().uuid("Invalid service type ID").optional(),

		ambulanceTypeId: z
			.string()
			.uuid("Invalid ambulance type ID")
			.optional(),

		patientId: z.string().uuid("Invalid patient ID").optional(),

		dateFrom: z.coerce.date().optional(),

		dateTo: z.coerce.date().optional(),

		search: z.string().trim().optional(),
	}),
});

export const getEmergencyRequestByIdSchema = z.object({
	params: z.object({
		id: z.string().uuid("Invalid emergency request ID"),
	}),
});

export const updateEmergencyRequestSchema = z.object({
	params: z.object({
		id: z.string().uuid("Invalid emergency request ID"),
	}),
	body: z.object({
		serviceTypeId: z.string().uuid("Invalid service type ID").optional(),

		ambulanceTypeId: z.string().uuid("Invalid ambulance type ID").optional(),

		pickupAddress: z
			.string()
			.min(5, "Pickup address must be at least 5 characters")
			.max(500, "Pickup address must not exceed 500 characters")
			.trim()
			.optional(),

		emergencyDescription: z
			.string()
			.max(1000, "Emergency description must not exceed 1000 characters")
			.trim()
			.optional(),

		patientCondition: z
			.string()
			.max(1000, "Patient condition must not exceed 1000 characters")
			.trim()
			.optional(),

		additionalNotes: z
			.string()
			.max(1000, "Additional notes must not exceed 1000 characters")
			.trim()
			.optional(),
	}),
});

export const cancelEmergencyRequestSchema = z.object({
	params: z.object({
		id: z.string().uuid("Invalid emergency request ID"),
	}),
	body: z.object({
		cancellationReason: z
			.string()
			.max(500, "Cancellation reason must not exceed 500 characters")
			.trim()
			.optional(),
	}),
});

export const getMyEmergencyRequestsSchema = z.object({
	query: z.object({
		page: z.string().optional(),
		limit: z.string().optional(),
		status: z
			.enum([
				"PENDING",
				"ACCEPTED",
				"DISPATCHED",
				"IN_PROGRESS",
				"COMPLETED",
				"CANCELLED",
				"REJECTED",
				"NO_AMBULANCE_AVAILABLE",
			])
			.optional(),
	}),
});
