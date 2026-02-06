import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateAgentRequest } from "../../route";

/**
 * Common Domain: Planning Status Tools
 *
 * MCP-ready: This can become an MCP resource/tool server
 * Resource: common://planning
 */

// GET /api/agent/common/planning - Get planning status
export async function GET(request: NextRequest) {
  const validation = await validateAgentRequest(request);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");

  // Default to current month if not provided
  const targetMonth =
    month || new Date().toISOString().slice(0, 7); // YYYY-MM

  try {
    // Get open month info
    const openMonth = await prisma.openMonth.findFirst({
      where: {
        userId: validation.userId,
        month: targetMonth,
      },
    });

    // Get Big Rocks for this month
    const bigRocks = await prisma.bigRock.findMany({
      where: {
        userId: validation.userId,
        month: targetMonth,
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

    const confirmedBigRocks = bigRocks.filter(
      (br) => br.status === "CONFIRMADO"
    );
    const totalTars = bigRocks.reduce((sum, br) => sum + br.tars.length, 0);
    const completedTars = bigRocks.reduce(
      (sum, br) =>
        sum + br.tars.filter((t) => t.status === "COMPLETADA").length,
      0
    );

    // Calculate overall progress
    const allTarProgress = bigRocks.flatMap((br) => br.tars.map((t) => t.progress));
    const overallProgress =
      allTarProgress.length > 0
        ? allTarProgress.reduce((sum, p) => sum + p, 0) / allTarProgress.length
        : 0;

    return NextResponse.json({
      success: true,
      data: {
        month: targetMonth,
        isMonthOpen: !!openMonth,
        isPlanningConfirmed: openMonth?.isPlanningConfirmed ?? false,
        confirmedAt: openMonth?.planningConfirmedAt,
        bigRocks: {
          total: bigRocks.length,
          confirmed: confirmedBigRocks.length,
          list: bigRocks.map((br) => ({
            id: br.id,
            title: br.title,
            status: br.status,
            tarsCount: br.tars.length,
            numTars: br.numTars,
          })),
        },
        tars: {
          total: totalTars,
          completed: completedTars,
          progress: Math.round(overallProgress),
        },
        readyToConfirm:
          bigRocks.length > 0 &&
          confirmedBigRocks.length === bigRocks.length &&
          !openMonth?.isPlanningConfirmed,
      },
    });
  } catch (error) {
    console.error("Error getting planning status:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get planning status" },
      { status: 500 }
    );
  }
}
