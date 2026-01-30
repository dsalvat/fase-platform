import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { successResponse, handleApiError } from "@/lib/api-response";
import { getLeaderboard } from "@/lib/gamification";

/**
 * GET /api/gamification/leaderboard
 * Get gamification leaderboard
 * Query params:
 * - limit: number of entries to return (default: 10, max: 50)
 */
export async function GET(request: NextRequest) {
  try {
    await requireAuth();

    const searchParams = request.nextUrl.searchParams;
    const limitParam = searchParams.get("limit");
    const limit = Math.min(Math.max(parseInt(limitParam || "10", 10), 1), 50);

    const leaderboard = await getLeaderboard(limit);

    return successResponse({
      leaderboard,
      total: leaderboard.length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
