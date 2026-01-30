import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { isMonthReadOnly } from "@/lib/month-helpers";
import { successResponse, handleApiError } from "@/lib/api-response";
import { monthParamSchema, createBigRockSchema } from "@/lib/validations/big-rock";

/**
 * GET /api/big-rocks
 * List Big Rocks for the authenticated user
 * Query params:
 * - month (optional): Filter by month (YYYY-MM format)
 * - userId (optional): For admins/supervisors to view other users' Big Rocks
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);

    const monthParam = searchParams.get("month");
    const requestedUserId = searchParams.get("userId");

    // Determine target user
    let targetUserId = user.id;

    if (requestedUserId && requestedUserId !== user.id) {
      // Check if user can view other user's Big Rocks
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const userRole = (user as any).role;

      if (userRole === "ADMIN") {
        // Admins can view any user
        targetUserId = requestedUserId;
      } else if (userRole === "SUPERVISOR") {
        // Supervisors can view supervisees
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

    // Validate month parameter if provided
    let monthFilter: string | undefined;
    if (monthParam) {
      const monthValidation = monthParamSchema.safeParse(monthParam);
      if (!monthValidation.success) {
        return handleApiError(new Error("Invalid month format. Use YYYY-MM"));
      }
      monthFilter = monthParam;
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

    return successResponse(bigRocks);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/big-rocks
 * Create a new Big Rock
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await request.json();

    // Validate request body
    const validationResult = createBigRockSchema.safeParse(body);
    if (!validationResult.success) {
      return handleApiError(new Error(validationResult.error.errors[0].message));
    }

    const { title, description, category, indicator, numTars, month, status } = validationResult.data;

    // Check if month is read-only (past)
    if (isMonthReadOnly(month)) {
      return handleApiError(new Error("No se pueden crear Big Rocks para meses pasados"));
    }

    // Create Big Rock
    const bigRock = await prisma.bigRock.create({
      data: {
        title,
        description,
        category,
        indicator,
        numTars,
        month,
        status: status || "PLANIFICADO",
        userId: user.id,
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
    });

    return successResponse(bigRock, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
