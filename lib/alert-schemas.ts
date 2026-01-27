import { z } from "zod";

// Schema for creating an alert
export const createAlertSchema = z.object({
  keywords: z.string().min(1, "Keywords are required").max(500, "Keywords cannot exceed 500 characters"),
  categoryId: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
});

// Schema for updating an alert
export const updateAlertSchema = z.object({
  keywords: z.string().min(1, "Keywords are required").max(500, "Keywords cannot exceed 500 characters").optional(),
  categoryId: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
});

// Type inference
export type CreateAlertInput = z.infer<typeof createAlertSchema>;
export type UpdateAlertInput = z.infer<typeof updateAlertSchema>;