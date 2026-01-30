import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { successResponse, handleApiError } from "@/lib/api-response";
import { activityLogQuerySchema } from "@/lib/validations/activity-log";
import { getActivityLogs } from "@/lib/activity-log";
import { UserRole } from "@prisma/client";

/**
 * GET /api/activity-logs
 * List activity logs with role-based access control
 * Query params:
 * - page (optional): Page number (default: 1)
 * - limit (optional): Items per page (default: 20, max: 100)
 * - entityType (optional): Filter by entity type
 * - action (optional): Filter by action type
 * - userId (optional): Filter by user ID (only for admins/supervisors)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const rawParams = {
      page: searchParams.get("page") || undefined,
      limit: searchParams.get("limit") || undefined,
      entityType: searchParams.get("entityType") || undefined,
      action: searchParams.get("action") || undefined,
      userId: searchParams.get("userId") || undefined,
    };

    // Validate query parameters
    const validationResult = activityLogQuerySchema.safeParse(rawParams);
    if (!validationResult.success) {
      return handleApiError(new Error(validationResult.error.errors[0].message));
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userRole = (user as any).role as UserRole;

    // Get activity logs
    const result = await getActivityLogs(user.id, userRole, validationResult.data);

    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
