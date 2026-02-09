import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { getCurrentCompanyId } from "@/lib/company-context";
import { isSupervisorInCompany } from "@/lib/supervisor-helpers";
import { successResponse, handleApiError } from "@/lib/api-response";
import { uuidParamSchema, monthParamSchema } from "@/lib/validations/big-rock";

interface RouteParams {
  params: Promise<{
    userId: string;
  }>;
}

/**
 * GET /api/big-rocks/supervised/:userId
 * Get Big Rocks for a supervised user (for supervisors and admins only)
 * Query params:
 * - month (optional): Filter by month (YYYY-MM format)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await params;
    // Require SUPERVISOR or ADMIN role
    const user = await requireRole(["SUPERVISOR", "ADMIN"]);
    const { searchParams } = new URL(request.url);

    // Validate userId parameter
    const userIdValidation = uuidParamSchema.safeParse(userId);
    if (!userIdValidation.success) {
      return handleApiError(new Error("ID de usuario inválido"));
    }

    const targetUserId = userId;

    // If user is SUPERVISOR, verify they supervise the target user (per-company)
    if (user.role === "SUPERVISOR") {
      const companyId = await getCurrentCompanyId();
      if (!companyId) {
        return handleApiError(new Error("No company selected"));
      }
      const isSup = await isSupervisorInCompany(user.id, targetUserId, companyId);
      if (!isSup) {
        return handleApiError(new Error("Forbidden: You do not supervise this user"));
      }
    }
    // ADMINs can view any user, no additional check needed

    // Validate month parameter if provided
    const monthParam = searchParams.get("month");
    let monthFilter: string | undefined;

    if (monthParam) {
      const monthValidation = monthParamSchema.safeParse(monthParam);
      if (!monthValidation.success) {
        return handleApiError(new Error("Invalid month format. Use YYYY-MM"));
      }
      monthFilter = monthParam;
    }

    // Fetch supervisee's info
    const supervisee = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    if (!supervisee) {
      return handleApiError(new Error("User not found"));
    }

    // Query Big Rocks
    const bigRocks = await prisma.bigRock.findMany({
      where: {
        userId: targetUserId,
        ...(monthFilter && { month: monthFilter }),
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

    return successResponse({
      user: supervisee,
      bigRocks,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
