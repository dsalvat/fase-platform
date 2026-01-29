import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { successResponse, handleApiError } from "@/lib/api-response";
import { monthParamSchema } from "@/lib/validations/big-rock";
import { isMonthReadOnly } from "@/lib/month-helpers";

interface RouteParams {
  params: Promise<{
    month: string;
  }>;
}

/**
 * GET /api/big-rocks/month/:month
 * Get all Big Rocks for a specific month
 * Query params:
 * - userId (optional): For admins/supervisors to view other users' Big Rocks
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { month: monthParam } = await params;
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get("userId");

    // Validate month parameter
    const monthValidation = monthParamSchema.safeParse(monthParam);
    if (!monthValidation.success) {
      return handleApiError(new Error("Invalid month format. Use YYYY-MM"));
    }

    const month = monthParam;

    // Determine target user
    let targetUserId = user.id;

    if (requestedUserId && requestedUserId !== user.id) {
      // Check if user can view other user's Big Rocks
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const userRole = (user as any).role;

      if (userRole === "ADMIN") {
        targetUserId = requestedUserId;
      } else if (userRole === "SUPERVISOR") {
        const supervisee = await prisma.user.findFirst({
          where: {
            id: requestedUserId,
            supervisorId: user.id,
          },
        });

        if (!supervisee) {
          return handleApiError(new Error("Forbidden"));
        }

        targetUserId = requestedUserId;
      } else {
        return handleApiError(new Error("Forbidden"));
      }
    }

    // Query Big Rocks for the specified month
    const bigRocks = await prisma.bigRock.findMany({
      where: {
        userId: targetUserId,
        month,
      },
      include: {
        tars: {
          select: {
            id: true,
            status: true,
          },
        },
        _count: {
          select: {
            keyMeetings: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Include metadata about the month
    const metadata = {
      month,
      isReadOnly: isMonthReadOnly(month),
      count: bigRocks.length,
    };

    return successResponse({
      bigRocks,
      metadata,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
