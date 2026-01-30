import { requireAuth } from "@/lib/auth";
import { successResponse, handleApiError } from "@/lib/api-response";
import { getViewableUsers } from "@/lib/activity-log";
import { UserRole } from "@prisma/client";

/**
 * GET /api/activity-logs/viewable-users
 * Get list of users whose activity logs the current user can view
 * Used for the user filter dropdown
 */
export async function GET() {
  try {
    const user = await requireAuth();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userRole = (user as any).role as UserRole;

    // Get viewable users
    const users = await getViewableUsers(user.id, userRole);

    return successResponse(users);
  } catch (error) {
    return handleApiError(error);
  }
}
