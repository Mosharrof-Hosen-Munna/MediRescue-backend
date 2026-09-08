import { z } from "zod";

export const registerPatientSchema = z.object({
	body: z.object({
		firstName: z
			.string()
			.min(2, "First name must be at least 2 characters")
			.max(50, "First name must not exceed 50 characters")
			.trim(),

		lastName: z
			.string()
			.min(2, "Last name must be at least 2 characters")
			.max(50, "Last name must not exceed 50 characters")
			.trim(),

		phone: z
			.string()
			.min(11, "Phone number must be at least 11 characters")
			.max(15, "Phone number must not exceed 15 characters")
			.trim(),

		email: z.string().email("Invalid email address").trim().toLowerCase(),

		password: z
			.string()
			.min(8, "Password must be at least 8 characters")
			.max(100, "Password must not exceed 100 characters"),
	}),
});

export const loginUserSchema = z.object({
	body: z.object({
		email: z.string().email("Invalid email address").trim().toLowerCase(),

		password: z
			.string()
			.min(8, "Password must be at least 8 characters")
			.max(100, "Password must not exceed 100 characters"),
	}),
});

export const AuthValidation = {
	registerPatientSchema,
	loginUserSchema,
};
