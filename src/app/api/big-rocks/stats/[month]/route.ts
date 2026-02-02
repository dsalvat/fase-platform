import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { successResponse, handleApiError } from "@/lib/api-response";
import { monthParamSchema } from "@/lib/validations/big-rock";

interface RouteParams {
  params: Promise<{
    month: string;
  }>;
}

/**
 * GET /api/big-rocks/stats/:month
 * Get Big Rock statistics for a month
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { month } = await params;
    const user = await requireAuth();

    // Validate month format
    const monthValidation = monthParamSchema.safeParse(month);
    if (!monthValidation.success) {
      return handleApiError(
        new Error("Formato de mes invalido. Use YYYY-MM")
      );
    }

    // Get Big Rocks for this month
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
            progress: true,
          },
        },
      },
    });

    // Calculate status distribution
    const statusDistribution = {
      CREADO: 0,
      CONFIRMADO: 0,
      FEEDBACK_RECIBIDO: 0,
      EN_PROGRESO: 0,
      FINALIZADO: 0,
    };

    bigRocks.forEach((br) => {
      statusDistribution[br.status]++;
    });

    // Calculate overall progress
    const totalTars = bigRocks.reduce((sum, br) => sum + br.tars.length, 0);
    const completedTars = bigRocks.reduce(
      (sum, br) => sum + br.tars.filter((t) => t.status === "COMPLETADA").length,
      0
    );
    const avgProgress =
      totalTars > 0
        ? Math.round(
            bigRocks.reduce(
              (sum, br) =>
                sum + br.tars.reduce((s, t) => s + t.progress, 0),
              0
            ) / totalTars
          )
        : 0;

    return successResponse({
      month,
      totalBigRocks: bigRocks.length,
      statusDistribution,
      progress: {
        totalTars,
        completedTars,
        avgProgress,
        completionRate: totalTars > 0 ? Math.round((completedTars / totalTars) * 100) : 0,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
