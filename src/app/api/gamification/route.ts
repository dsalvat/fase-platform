import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { successResponse, handleApiError } from "@/lib/api-response";
import {
  getGamificationSummary,
  awardPoints,
} from "@/lib/gamification";
import { awardPointsSchema } from "@/lib/validations/gamification";
import { getLevelProgress, getPointsForNextLevel } from "@/types/gamification";

/**
 * GET /api/gamification
 * Get current user's gamification summary
 */
export async function GET() {
  try {
    const user = await requireAuth();

    const summary = await getGamificationSummary(user.id);

    if (!summary) {
      // Return empty gamification state for new users
      return successResponse({
        points: 0,
        level: 1,
        levelProgress: 0,
        pointsToNextLevel: 100,
        currentStreak: 0,
        longestStreak: 0,
        medals: [],
        stats: {
          bigRocksCreated: 0,
          tarsCompleted: 0,
          weeklyReviews: 0,
          dailyLogs: 0,
        },
      });
    }

    const levelProgress = getLevelProgress(summary.points);
    const pointsToNextLevel = getPointsForNextLevel(summary.level);

    return successResponse({
      points: summary.points,
      level: summary.level,
      levelProgress,
      pointsToNextLevel:
        pointsToNextLevel === Infinity
          ? null
          : pointsToNextLevel - summary.points,
      currentStreak: summary.currentStreak,
      longestStreak: summary.longestStreak,
      medals: summary.medals,
      stats: {
        bigRocksCreated: summary.bigRocksCreated,
        tarsCompleted: summary.tarsCompleted,
        weeklyReviews: summary.weeklyReviews,
        dailyLogs: summary.dailyLogs,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/gamification
 * Award points for a specific action (for admin/testing purposes)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    // Validate request body
    const validation = awardPointsSchema.safeParse(body);
    if (!validation.success) {
      return handleApiError(
        new Error(validation.error.errors[0]?.message || "Invalid request")
      );
    }

    const { action, metadata } = validation.data;

    // Award points to the current user
    const result = await awardPoints(user.id, action);

    return successResponse({
      action,
      points: result.points,
      newTotal: result.newTotal,
      levelUp: result.levelUp,
      newLevel: result.newLevel,
      metadata,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
