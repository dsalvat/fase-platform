import { z } from "zod";

/**
 * Schema for creating a new KeyMeeting
 */
export const createKeyMeetingSchema = z.object({
  title: z
    .string()
    .min(3, "El título debe tener al menos 3 caracteres")
    .max(200, "El título no puede exceder 200 caracteres"),

  description: z
    .string()
    .max(2000, "La descripción no puede exceder 2000 caracteres")
    .optional()
    .nullable(),

  date: z
    .string()
    .datetime({ message: "Fecha inválida" })
    .or(z.date()),

  bigRockId: z.string().uuid("ID de Big Rock inválido"),

  completed: z
    .boolean()
    .optional()
    .default(false),

  outcome: z
    .string()
    .max(2000, "El resultado no puede exceder 2000 caracteres")
    .optional()
    .nullable(),
});

/**
 * Schema for updating an existing KeyMeeting
 * All fields are optional except id
 */
export const updateKeyMeetingSchema = z.object({
  id: z.string().uuid("ID inválido"),

  title: z
    .string()
    .min(3, "El título debe tener al menos 3 caracteres")
    .max(200, "El título no puede exceder 200 caracteres")
    .optional(),

  description: z
    .string()
    .max(2000, "La descripción no puede exceder 2000 caracteres")
    .optional()
    .nullable(),

  date: z
    .string()
    .datetime({ message: "Fecha inválida" })
    .or(z.date())
    .optional(),

  completed: z
    .boolean()
    .optional(),

  outcome: z
    .string()
    .max(2000, "El resultado no puede exceder 2000 caracteres")
    .optional()
    .nullable(),
});

/**
 * Schema for toggling KeyMeeting completion
 */
export const toggleKeyMeetingCompletionSchema = z.object({
  id: z.string().uuid("ID inválido"),
  completed: z.boolean(),
  outcome: z
    .string()
    .max(2000, "El resultado no puede exceder 2000 caracteres")
    .optional()
    .nullable(),
});

// Type exports for TypeScript
export type CreateKeyMeetingInput = z.infer<typeof createKeyMeetingSchema>;
export type UpdateKeyMeetingInput = z.infer<typeof updateKeyMeetingSchema>;
export type ToggleKeyMeetingCompletionInput = z.infer<typeof toggleKeyMeetingCompletionSchema>;
