import { z } from "zod";
import { BigRockStatus, FaseCategory } from "@prisma/client";

/**
 * Schema for creating a new Big Rock
 */
export const createBigRockSchema = z.object({
  title: z
    .string()
    .min(3, "El título debe tener al menos 3 caracteres")
    .max(100, "El título no puede exceder 100 caracteres"),

  description: z
    .string()
    .min(10, "La descripción debe tener al menos 10 caracteres")
    .max(2000, "La descripción no puede exceder 2000 caracteres"),

  indicator: z
    .string()
    .min(5, "El indicador debe tener al menos 5 caracteres")
    .max(500, "El indicador no puede exceder 500 caracteres"),

  numTars: z
    .number()
    .int("El número de TARs debe ser un entero")
    .min(1, "Debe tener al menos 1 TAR")
    .max(20, "No puede exceder 20 TARs"),

  month: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "El mes debe estar en formato YYYY-MM"),

  status: z
    .nativeEnum(BigRockStatus, {
      errorMap: () => ({ message: "Estado inválido" }),
    })
    .optional()
    .default("CREADO"),

  category: z
    .nativeEnum(FaseCategory, {
      errorMap: () => ({ message: "Categoría FASE inválida" }),
    })
    .nullable()
    .optional(),
});

/**
 * Schema for updating an existing Big Rock
 * All fields are optional except id
 */
export const updateBigRockSchema = createBigRockSchema.partial().extend({
  id: z.string().uuid("ID inválido"),
});

/**
 * Schema for month parameter (YYYY-MM format)
 */
export const monthParamSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "El mes debe estar en formato YYYY-MM");

/**
 * Schema for UUID parameter
 */
export const uuidParamSchema = z.string().uuid("ID inválido");

/**
 * Validate that a month is in the future (not past)
 * @param month - Month string in YYYY-MM format
 * @returns true if month is current or future, false otherwise
 */
export function validateMonthIsFuture(month: string): boolean {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  return month >= currentMonth;
}

/**
 * Get the next month from a given month
 * @param currentMonth - Current month in YYYY-MM format (optional, defaults to current month)
 * @returns Next month in YYYY-MM format
 */
export function getNextMonth(currentMonth?: string): string {
  const base = currentMonth || getCurrentMonth();
  const [year, month] = base.split('-').map(Number);

  if (month === 12) {
    return `${year + 1}-01`;
  }

  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

/**
 * Get current month in YYYY-MM format
 * @returns Current month string
 */
export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// Type exports for TypeScript
export type CreateBigRockInput = z.infer<typeof createBigRockSchema>;
export type UpdateBigRockInput = z.infer<typeof updateBigRockSchema>;
