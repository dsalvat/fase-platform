import { z } from "zod";
import { LogEntityType, LogActionType } from "@prisma/client";

/**
 * Schema for activity log query parameters
 */
export const activityLogQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  entityType: z.nativeEnum(LogEntityType).optional(),
  action: z.nativeEnum(LogActionType).optional(),
  userId: z.string().uuid().optional(),
});

/**
 * Schema for creating an activity log entry
 */
export const createActivityLogSchema = z.object({
  action: z.nativeEnum(LogActionType),
  entityType: z.nativeEnum(LogEntityType),
  entityId: z.string().uuid(),
  description: z.string().min(1).max(500),
  entityTitle: z.string().max(200).optional(),
  metadata: z.record(z.unknown()).optional(),
  userId: z.string().uuid(),
});

// Type exports for TypeScript
export type ActivityLogQueryInput = z.infer<typeof activityLogQuerySchema>;
export type CreateActivityLogInput = z.infer<typeof createActivityLogSchema>;
