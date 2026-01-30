import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { successResponse, handleApiError } from "@/lib/api-response";
import {
  monthSchema,
  getCurrentMonth,
  isMonthPast,
  getMonthLabel,
} from "@/lib/validations/open-month";

interface RouteParams {
  params: Promise<{
    month: string;
  }>;
}

/**
 * GET /api/months/:month
 * Get status for a specific month
 * Returns month info, open status, Big Rock count, and stats
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { month } = await params;
    const user = await requireAuth();

    // Validate month format
    const monthValidation = monthSchema.safeParse(month);
    if (!monthValidation.success) {
      return handleApiError(
        new Error("Formato de mes invalido. Use YYYY-MM")
      );
    }

    const currentMonth = getCurrentMonth();
    const isPast = isMonthPast(month);
    const isCurrent = month === currentMonth;

    // Check if month is explicitly opened (for future months)
    let isOpen = isPast || isCurrent; // Past and current months are always "accessible"
    let openedAt: Date | null = null;

    if (!isPast && !isCurrent) {
      const openMonth = await prisma.openMonth.findUnique({
        where: {
          month_userId: {
            month,
            userId: user.id,
          },
        },
      });
      isOpen = !!openMonth;
      openedAt = openMonth?.openedAt || null;
    }

    // Get Big Rock stats for this month
    const bigRocks = await prisma.bigRock.findMany({
      where: {
        month,
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

    // Calculate stats
    const stats = {
      totalBigRocks: bigRocks.length,
      byStatus: {
        PLANIFICADO: bigRocks.filter((b) => b.status === "PLANIFICADO").length,
        EN_PROGRESO: bigRocks.filter((b) => b.status === "EN_PROGRESO").length,
        FINALIZADO: bigRocks.filter((b) => b.status === "FINALIZADO").length,
      },
      totalTars: bigRocks.reduce((sum, b) => sum + b.tars.length, 0),
      completedTars: bigRocks.reduce(
        (sum, b) => sum + b.tars.filter((t) => t.status === "COMPLETADA").length,
        0
      ),
      totalMeetings: bigRocks.reduce((sum, b) => sum + b._count.keyMeetings, 0),
    };

    return successResponse({
      month,
      label: getMonthLabel(month),
      status: isPast ? "past" : isCurrent ? "current" : "future",
      isOpen,
      isReadOnly: isPast,
      openedAt,
      stats,
      bigRocks: bigRocks.map((b) => ({
        id: b.id,
        title: b.title,
        status: b.status,
        numTars: b.numTars,
        actualTars: b.tars.length,
        completedTars: b.tars.filter((t) => t.status === "COMPLETADA").length,
        meetings: b._count.keyMeetings,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
