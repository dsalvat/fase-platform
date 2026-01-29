import { z } from "zod";
import { ActivityType } from "@prisma/client";

/**
 * Schema for creating a new Activity
 */
export const createActivitySchema = z.object({
  title: z
    .string()
    .min(3, "El titulo debe tener al menos 3 caracteres")
    .max(200, "El titulo no puede exceder 200 caracteres"),

  description: z
    .string()
    .max(2000, "La descripcion no puede exceder 2000 caracteres")
    .optional()
    .nullable(),

  type: z.nativeEnum(ActivityType, {
    errorMap: () => ({ message: "Tipo de actividad invalido" }),
  }),

  date: z.coerce.date({
    errorMap: () => ({ message: "Fecha invalida" }),
  }),

  week: z
    .string()
    .regex(/^\d{4}-W(0[1-9]|[1-4][0-9]|5[0-3])$/, "Formato de semana invalido (YYYY-Wnn)")
    .optional()
    .nullable(),

  tarId: z.string().uuid("ID de TAR invalido"),

  completed: z.boolean().optional().default(false),

  notes: z
    .string()
    .max(2000, "Las notas no pueden exceder 2000 caracteres")
    .optional()
    .nullable(),
});

/**
 * Schema for updating an existing Activity
 */
export const updateActivitySchema = z.object({
  id: z.string().uuid("ID invalido"),

  title: z
    .string()
    .min(3, "El titulo debe tener al menos 3 caracteres")
    .max(200, "El titulo no puede exceder 200 caracteres")
    .optional(),

  description: z
    .string()
    .max(2000, "La descripcion no puede exceder 2000 caracteres")
    .optional()
    .nullable(),

  type: z
    .nativeEnum(ActivityType, {
      errorMap: () => ({ message: "Tipo de actividad invalido" }),
    })
    .optional(),

  date: z.coerce
    .date({
      errorMap: () => ({ message: "Fecha invalida" }),
    })
    .optional(),

  week: z
    .string()
    .regex(/^\d{4}-W(0[1-9]|[1-4][0-9]|5[0-3])$/, "Formato de semana invalido (YYYY-Wnn)")
    .optional()
    .nullable(),

  completed: z.boolean().optional(),

  notes: z
    .string()
    .max(2000, "Las notas no pueden exceder 2000 caracteres")
    .optional()
    .nullable(),
});

/**
 * Schema for toggling activity completion
 */
export const toggleActivityCompletionSchema = z.object({
  id: z.string().uuid("ID invalido"),
  completed: z.boolean(),
});

/**
 * Helper to calculate week string from date
 */
export function getWeekString(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

// Type exports
export type CreateActivityInput = z.infer<typeof createActivitySchema>;
export type UpdateActivityInput = z.infer<typeof updateActivitySchema>;
export type ToggleActivityCompletionInput = z.infer<typeof toggleActivityCompletionSchema>;
