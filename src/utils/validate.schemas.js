import { z } from "zod";
import AppError from "./appError.js";

// Reusable validator function
export const validateBody = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    // Map Zod issues into human-friendly messages
    const issues = result.error.issues.map((issue) => {
      if (issue.code === "unrecognized_keys") {
        const keys = issue.keys.join(", ");
        return `The field(s) ${keys} are not allowed.`;
      }
      return issue.message;
    });

    const message = issues.join(", ") || "Invalid input data.";

    return next(new AppError(message, 400));
  }

  req.body = result.data;
  next();
};

// ----------- Schemas ---------------- //
export const updateMeSchema = z
  .object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters long")
      .optional(),
    email: z.email("Invalid email format").optional(),
    photo: z.url("Photo must be a valid URL").optional(),
  })
  .refine((data) => !("password" in data || "confirmPassword" in data), {
    message: "Password updates are not allowed on this route.",
  })
  .strict(); // Rejects *unknown* fields like role
