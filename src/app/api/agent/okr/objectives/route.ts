import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateAgentRequest } from "../../route";
import { TeamMemberRole, OKRObjectiveStatus } from "@prisma/client";

/**
 * OKR Domain: Objectives Tools
 *
 * MCP-ready: This can become an MCP resource/tool server
 * Resource: okr://objectives
 */

// Helper to calculate progress from KR values
function calculateKRProgress(current: number, start: number, target: number): number {
  const range = target - start;
  if (range === 0) return current >= target ? 100 : 0;
  return Math.round(Math.min(100, Math.max(0, ((current - start) / range) * 100)));
}

// GET /api/agent/okr/objectives - List objectives
export async function GET(request: NextRequest) {
  const validation = await validateAgentRequest(request);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const teamId = searchParams.get("teamId");
  const quarterId = searchParams.get("quarterId");
  const status = searchParams.get("status") as OKRObjectiveStatus | null;

  try {
    // Get user's teams
    const userTeams = await prisma.teamMember.findMany({
      where: { userId: validation.userId },
      select: { teamId: true },
    });
    const teamIds = userTeams.map((t) => t.teamId);

    const objectives = await prisma.oKRObjective.findMany({
      where: {
        teamId: teamId || { in: teamIds },
        ...(quarterId && { quarterId }),
        ...(status && { status }),
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
          },
        },
        quarter: {
          select: {
            id: true,
            year: true,
            quarter: true,
          },
        },
        keyResults: {
          include: {
            activities: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = objectives.map((obj) => {
      // Calculate progress from key results
      const krProgress = obj.keyResults.map((kr) =>
        calculateKRProgress(kr.currentValue, kr.startValue, kr.targetValue)
      );
      const progress =
        krProgress.length > 0
          ? Math.round(krProgress.reduce((sum, p) => sum + p, 0) / krProgress.length)
          : 0;

      return {
        id: obj.id,
        title: obj.title,
        description: obj.description,
        status: obj.status,
        progress,
        team: obj.team,
        quarter: obj.quarter
          ? `Q${obj.quarter.quarter} ${obj.quarter.year}`
          : null,
        keyResultsCount: obj.keyResults.length,
        keyResults: obj.keyResults.map((kr) => {
          const krProg = calculateKRProgress(kr.currentValue, kr.startValue, kr.targetValue);
          return {
            id: kr.id,
            title: kr.title,
            indicator: kr.indicator,
            targetValue: kr.targetValue,
            currentValue: kr.currentValue,
            startValue: kr.startValue,
            unit: kr.unit,
            progress: krProg,
            activitiesCount: kr.activities.length,
            completedActivities: kr.activities.filter((a) => a.completed).length,
          };
        }),
      };
    });

    return NextResponse.json({
      success: true,
      data: formatted,
      meta: {
        total: formatted.length,
        byStatus: {
          draft: formatted.filter((o) => o.status === "DRAFT").length,
          active: formatted.filter((o) => o.status === "ACTIVE").length,
          completed: formatted.filter((o) => o.status === "COMPLETED").length,
          cancelled: formatted.filter((o) => o.status === "CANCELLED").length,
        },
      },
    });
  } catch (error) {
    console.error("Error listing objectives:", error);
    return NextResponse.json(
      { success: false, error: "Failed to list objectives" },
      { status: 500 }
    );
  }
}

// POST /api/agent/okr/objectives - Create objective
export async function POST(request: NextRequest) {
  const validation = await validateAgentRequest(request);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { teamId, quarterId, title, description, indicator, keyResults } = body;

    if (!teamId || !title) {
      return NextResponse.json(
        { success: false, error: "teamId and title are required" },
        { status: 400 }
      );
    }

    // Verify user is RESPONSABLE in the team
    const membership = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: validation.userId,
        role: TeamMemberRole.RESPONSABLE,
      },
    });

    if (!membership) {
      return NextResponse.json(
        {
          success: false,
          error: "You must be a RESPONSABLE to create objectives",
        },
        { status: 403 }
      );
    }

    // Get active quarter if not provided
    let activeQuarterId = quarterId;
    if (!activeQuarterId) {
      const activeQuarter = await prisma.oKRQuarter.findFirst({
        where: { isActive: true },
        orderBy: { year: "desc" },
      });
      activeQuarterId = activeQuarter?.id;
    }

    // Create objective with key results
    const objective = await prisma.$transaction(async (tx) => {
      const obj = await tx.oKRObjective.create({
        data: {
          teamId,
          quarterId: activeQuarterId!,
          ownerId: validation.userId!,
          title,
          description: description || "",
          indicator: indicator || title,
          status: OKRObjectiveStatus.DRAFT,
          progress: 0,
        },
      });

      // Create key results if provided
      if (keyResults && Array.isArray(keyResults)) {
        for (const kr of keyResults) {
          await tx.oKRKeyResult.create({
            data: {
              objectiveId: obj.id,
              responsibleId: validation.userId!,
              title: kr.title,
              indicator: kr.indicator || kr.title,
              targetValue: kr.targetValue || 100,
              currentValue: kr.startValue || 0,
              startValue: kr.startValue || 0,
              unit: kr.unit || "%",
            },
          });
        }
      }

      return obj;
    });

    return NextResponse.json({
      success: true,
      data: {
        id: objective.id,
        title: objective.title,
        status: objective.status,
      },
      message: `Objective "${title}" created successfully`,
    });
  } catch (error) {
    console.error("Error creating objective:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create objective" },
      { status: 500 }
    );
  }
}
