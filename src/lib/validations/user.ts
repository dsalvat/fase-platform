import { z } from "zod";
import { UserRole } from "@prisma/client";

/**
 * Schema for updating a user
 */
export const updateUserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  role: z.nativeEnum(UserRole).optional(),
  supervisorId: z.string().uuid().nullable().optional(),
  isActive: z.boolean().optional(),
});

/**
 * Schema for user query parameters
 */
export const userQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  search: z.string().optional(),
  role: z.nativeEnum(UserRole).optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UserQueryInput = z.infer<typeof userQuerySchema>;
