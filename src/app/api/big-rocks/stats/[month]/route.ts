import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { successResponse, handleApiError } from "@/lib/api-response";
import { monthParamSchema } from "@/lib/validations/big-rock";
import { FaseCategory } from "@prisma/client";

interface RouteParams {
  params: Promise<{
    month: string;
  }>;
}

/**
 * FASE Category configuration
 */
const faseConfig: Record<
  FaseCategory,
  { label: string; description: string; color: string }
> = {
  FOCUS: {
    label: "Focus",
    description: "Objetivos relacionados con enfoque y priorizacion",
    color: "#3B82F6", // blue
  },
  ATENCION: {
    label: "Atencion",
    description: "Objetivos de presencia y conciencia",
    color: "#8B5CF6", // purple
  },
  SISTEMAS: {
    label: "Sistemas",
    description: "Objetivos de procesos y estructuras",
    color: "#10B981", // green
  },
  ENERGIA: {
    label: "Energia",
    description: "Objetivos de vitalidad y bienestar",
    color: "#F59E0B", // amber
  },
};

/**
 * Calculate balance score and recommendations
 */
function analyzeBalance(distribution: Record<FaseCategory, number>) {
  const categories = Object.keys(distribution) as FaseCategory[];
  const counts = Object.values(distribution);
  const total = counts.reduce((sum, c) => sum + c, 0);

  if (total === 0) {
    return {
      score: 0,
      isBalanced: false,
      message: "No hay Big Rocks para este mes. Crea al menos uno en cada categoria FASE.",
      recommendations: [
        "Considera crear al menos un Big Rock en cada categoria FASE",
        "La metodologia FASE funciona mejor cuando hay equilibrio entre las cuatro areas",
      ],
      percentages: { FOCUS: 0, ATENCION: 0, SISTEMAS: 0, ENERGIA: 0 } as Record<FaseCategory, number>,
      deviations: { FOCUS: 25, ATENCION: 25, SISTEMAS: 25, ENERGIA: 25 } as Record<FaseCategory, number>,
    };
  }

  // Calculate ideal percentage (25% each)
  const idealPercentage = 25;

  // Calculate actual percentages and deviations
  const percentages: Record<FaseCategory, number> = {} as Record<FaseCategory, number>;
  const deviations: Record<FaseCategory, number> = {} as Record<FaseCategory, number>;

  categories.forEach((cat) => {
    const percentage = (distribution[cat] / total) * 100;
    percentages[cat] = Math.round(percentage * 10) / 10;
    deviations[cat] = Math.abs(percentage - idealPercentage);
  });

  // Calculate balance score (100 = perfect balance, 0 = completely unbalanced)
  const avgDeviation = Object.values(deviations).reduce((sum, d) => sum + d, 0) / 4;
  const score = Math.max(0, Math.round(100 - avgDeviation * 2));

  // Determine balance status
  const isBalanced = score >= 70;

  // Generate recommendations
  const recommendations: string[] = [];
  const missing = categories.filter((cat) => distribution[cat] === 0);
  const overweight = categories.filter((cat) => percentages[cat] > 40);
  const underweight = categories.filter(
    (cat) => distribution[cat] > 0 && percentages[cat] < 15
  );

  if (missing.length > 0) {
    recommendations.push(
      `Falta representacion en: ${missing.map((c) => faseConfig[c].label).join(", ")}. Considera agregar Big Rocks en estas areas.`
    );
  }

  if (overweight.length > 0) {
    recommendations.push(
      `Exceso de enfoque en: ${overweight.map((c) => faseConfig[c].label).join(", ")} (>${40}%). Considera equilibrar con otras categorias.`
    );
  }

  if (underweight.length > 0 && missing.length === 0) {
    recommendations.push(
      `Baja representacion en: ${underweight.map((c) => faseConfig[c].label).join(", ")} (<15%). Considera agregar mas objetivos en estas areas.`
    );
  }

  if (isBalanced && recommendations.length === 0) {
    recommendations.push(
      "¡Excelente! Tu planificacion esta bien equilibrada entre las cuatro categorias FASE."
    );
  }

  // Generate message
  let message: string;
  if (score >= 90) {
    message = "Distribucion excelente. Mantén este equilibrio.";
  } else if (score >= 70) {
    message = "Distribucion buena con pequenas areas de mejora.";
  } else if (score >= 50) {
    message = "Distribucion moderada. Considera equilibrar las categorias.";
  } else {
    message = "Distribucion desequilibrada. Revisa la distribucion de categorias.";
  }

  return {
    score,
    isBalanced,
    message,
    recommendations,
    percentages,
    deviations,
  };
}

/**
 * GET /api/big-rocks/stats/:month
 * Get FASE category distribution and balance analysis for a month
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

    // Calculate distribution by category
    const distribution: Record<FaseCategory, number> = {
      FOCUS: 0,
      ATENCION: 0,
      SISTEMAS: 0,
      ENERGIA: 0,
    };

    bigRocks.forEach((br) => {
      distribution[br.category]++;
    });

    // Analyze balance
    const analysis = analyzeBalance(distribution);

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

    // Build category details
    const categories = (Object.keys(distribution) as FaseCategory[]).map(
      (cat) => {
        const categoryBigRocks = bigRocks.filter((br) => br.category === cat);
        const categoryTars = categoryBigRocks.flatMap((br) => br.tars);

        return {
          category: cat,
          ...faseConfig[cat],
          count: distribution[cat],
          percentage: analysis.percentages[cat] || 0,
          deviation: analysis.deviations[cat] || 0,
          bigRocks: categoryBigRocks.map((br) => ({
            id: br.id,
            title: br.title,
            status: br.status,
            tarsCount: br.tars.length,
            completedTars: br.tars.filter((t) => t.status === "COMPLETADA").length,
          })),
          stats: {
            totalTars: categoryTars.length,
            completedTars: categoryTars.filter((t) => t.status === "COMPLETADA").length,
            inProgressTars: categoryTars.filter((t) => t.status === "EN_PROGRESO").length,
            avgProgress:
              categoryTars.length > 0
                ? Math.round(
                    categoryTars.reduce((s, t) => s + t.progress, 0) /
                      categoryTars.length
                  )
                : 0,
          },
        };
      }
    );

    return successResponse({
      month,
      totalBigRocks: bigRocks.length,
      balance: {
        score: analysis.score,
        isBalanced: analysis.isBalanced,
        message: analysis.message,
        recommendations: analysis.recommendations,
      },
      distribution,
      categories,
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
