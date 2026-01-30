import { z } from "zod";
import { UserRole, UserStatus } from "@prisma/client";

/**
 * Schema for updating a user
 */
export const updateUserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  role: z.nativeEnum(UserRole).optional(),
  supervisorId: z.string().uuid().nullable().optional(),
  status: z.nativeEnum(UserStatus).optional(),
});

/**
 * Schema for inviting a new user
 */
export const inviteUserSchema = z.object({
  email: z
    .string()
    .email("Email invalido")
    .min(1, "El email es requerido")
    .max(255, "El email no puede exceder 255 caracteres"),
  name: z
    .string()
    .min(1, "El nombre debe tener al menos 1 caracter")
    .max(100, "El nombre no puede exceder 100 caracteres")
    .optional()
    .nullable(),
  role: z.nativeEnum(UserRole).optional().default(UserRole.USER),
  supervisorId: z.string().uuid().nullable().optional(),
});

/**
 * Schema for user query parameters
 */
export const userQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  search: z.string().optional(),
  role: z.nativeEnum(UserRole).optional(),
  status: z.nativeEnum(UserStatus).optional(),
  hideDeactivated: z.coerce.boolean().optional().default(true),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type InviteUserInput = z.infer<typeof inviteUserSchema>;
export type UserQueryInput = z.infer<typeof userQuerySchema>;
