import { z } from "zod";

/**
 * Schema for creating/updating feedback
 */
export const feedbackSchema = z.object({
  targetType: z.enum(["BIG_ROCK", "MONTH_PLANNING"]),
  targetId: z.string().uuid("Invalid target ID"),
  comment: z.string().min(1, "El comentario es requerido").max(2000, "El comentario no puede exceder 2000 caracteres"),
  rating: z.number().min(1).max(5).optional(),
});

export type FeedbackInput = z.infer<typeof feedbackSchema>;
