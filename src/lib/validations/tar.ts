import { z } from "zod";
import { TarStatus } from "@prisma/client";

/**
 * Schema for creating a new TAR
 */
export const createTARSchema = z.object({
  description: z
    .string()
    .min(5, "La descripción debe tener al menos 5 caracteres")
    .max(2000, "La descripción no puede exceder 2000 caracteres"),

  bigRockId: z.string().uuid("ID de Big Rock inválido"),

  status: z
    .nativeEnum(TarStatus, {
      errorMap: () => ({ message: "Estado inválido" }),
    })
    .optional()
    .default("PENDIENTE"),

  progress: z
    .number()
    .int("El progreso debe ser un entero")
    .min(0, "El progreso no puede ser negativo")
    .max(100, "El progreso no puede exceder 100")
    .optional()
    .default(0),
});

/**
 * Schema for updating an existing TAR
 * All fields are optional except id
 */
export const updateTARSchema = z.object({
  id: z.string().uuid("ID inválido"),

  description: z
    .string()
    .min(5, "La descripción debe tener al menos 5 caracteres")
    .max(2000, "La descripción no puede exceder 2000 caracteres")
    .optional(),

  status: z
    .nativeEnum(TarStatus, {
      errorMap: () => ({ message: "Estado inválido" }),
    })
    .optional(),

  progress: z
    .number()
    .int("El progreso debe ser un entero")
    .min(0, "El progreso no puede ser negativo")
    .max(100, "El progreso no puede exceder 100")
    .optional(),
});

/**
 * Schema for updating TAR progress only
 */
export const updateTARProgressSchema = z.object({
  id: z.string().uuid("ID inválido"),
  progress: z
    .number()
    .int("El progreso debe ser un entero")
    .min(0, "El progreso no puede ser negativo")
    .max(100, "El progreso no puede exceder 100"),
});

/**
 * Schema for updating TAR status only
 */
export const updateTARStatusSchema = z.object({
  id: z.string().uuid("ID inválido"),
  status: z.nativeEnum(TarStatus, {
    errorMap: () => ({ message: "Estado inválido" }),
  }),
});

// Type exports for TypeScript
export type CreateTARInput = z.infer<typeof createTARSchema>;
export type UpdateTARInput = z.infer<typeof updateTARSchema>;
export type UpdateTARProgressInput = z.infer<typeof updateTARProgressSchema>;
export type UpdateTARStatusInput = z.infer<typeof updateTARStatusSchema>;
