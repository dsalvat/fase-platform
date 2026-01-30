import { z } from "zod";

/**
 * Schema for creating a new KeyPerson
 */
export const createKeyPersonSchema = z.object({
  firstName: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(50, "El nombre no puede exceder 50 caracteres"),

  lastName: z
    .string()
    .min(2, "El apellido debe tener al menos 2 caracteres")
    .max(50, "El apellido no puede exceder 50 caracteres"),

  role: z
    .string()
    .max(100, "El rol no puede exceder 100 caracteres")
    .optional()
    .nullable(),

  contact: z
    .string()
    .max(200, "El contacto no puede exceder 200 caracteres")
    .optional()
    .nullable(),
});

/**
 * Schema for updating an existing KeyPerson
 * All fields are optional except id
 */
export const updateKeyPersonSchema = createKeyPersonSchema.partial().extend({
  id: z.string().uuid("ID inválido"),
});

/**
 * Schema for linking a KeyPerson to a TAR
 */
export const linkKeyPersonToTARSchema = z.object({
  keyPersonId: z.string().uuid("ID de persona clave inválido"),
  tarId: z.string().uuid("ID de TAR inválido"),
});

// Type exports for TypeScript
export type CreateKeyPersonInput = z.infer<typeof createKeyPersonSchema>;
export type UpdateKeyPersonInput = z.infer<typeof updateKeyPersonSchema>;
export type LinkKeyPersonToTARInput = z.infer<typeof linkKeyPersonToTARSchema>;
