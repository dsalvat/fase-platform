import { z } from "zod";

/**
 * Generate slug from company name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .trim();
}

/**
 * Schema for creating a company
 */
export const createCompanySchema = z.object({
  name: z
    .string()
    .min(1, "El nombre es requerido")
    .max(100, "El nombre no puede exceder 100 caracteres"),
  slug: z
    .string()
    .min(1, "El identificador es requerido")
    .max(50, "El identificador no puede exceder 50 caracteres")
    .regex(/^[a-z0-9-]+$/, "El identificador solo puede contener letras minusculas, numeros y guiones")
    .optional(),
});

/**
 * Schema for updating a company
 */
export const updateCompanySchema = z.object({
  id: z.string().cuid(),
  name: z
    .string()
    .min(1, "El nombre es requerido")
    .max(100, "El nombre no puede exceder 100 caracteres")
    .optional(),
  slug: z
    .string()
    .min(1, "El identificador es requerido")
    .max(50, "El identificador no puede exceder 50 caracteres")
    .regex(/^[a-z0-9-]+$/, "El identificador solo puede contener letras minusculas, numeros y guiones")
    .optional(),
  logo: z
    .string()
    .url("La URL del logo no es valida")
    .nullable()
    .optional(),
});

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
