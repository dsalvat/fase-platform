import { z } from "zod";
import { MedalType, MedalLevel } from "@prisma/client";

/**
 * Schema for point action
 */
export const pointActionSchema = z.enum([
  "CREATE_BIG_ROCK",
  "WEEKLY_PLANNING",
  "WEEKLY_REVIEW",
  "DAILY_LOG",
  "COMPLETE_TAR",
  "STREAK_7_DAYS",
  "STREAK_30_DAYS",
]);

/**
 * Schema for awarding points
 */
export const awardPointsSchema = z.object({
  userId: z.string().uuid("ID de usuario invalido"),
  action: pointActionSchema,
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Schema for medal type
 */
export const medalTypeSchema = z.nativeEnum(MedalType, {
  errorMap: () => ({ message: "Tipo de medalla invalido" }),
});

/**
 * Schema for medal level
 */
export const medalLevelSchema = z.nativeEnum(MedalLevel, {
  errorMap: () => ({ message: "Nivel de medalla invalido" }),
});

/**
 * Schema for awarding medal
 */
export const awardMedalSchema = z.object({
  userId: z.string().uuid("ID de usuario invalido"),
  type: medalTypeSchema,
  level: medalLevelSchema,
});

/**
 * Schema for updating streak
 */
export const updateStreakSchema = z.object({
  userId: z.string().uuid("ID de usuario invalido"),
  increment: z.boolean().default(true), // true to increment, false to reset
});

// Type exports
export type PointActionInput = z.infer<typeof pointActionSchema>;
export type AwardPointsInput = z.infer<typeof awardPointsSchema>;
export type AwardMedalInput = z.infer<typeof awardMedalSchema>;
export type UpdateStreakInput = z.infer<typeof updateStreakSchema>;
