import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateAgentRequest } from "../../route";

/**
 * OKR Domain: Teams Tools
 *
 * MCP-ready: This can become an MCP resource/tool server
 * Resource: okr://teams
 */

// Helper to calculate progress from KR values
function calculateKRProgress(current: number, start: number, target: number): number {
  const range = target - start;
  if (range === 0) return current >= target ? 100 : 0;
  return Math.round(Math.min(100, Math.max(0, ((current - start) / range) * 100)));
}

// GET /api/agent/okr/teams - List user's teams
export async function GET(request: NextRequest) {
  const validation = await validateAgentRequest(request);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 401 });
  }

  try {
    const teams = await prisma.team.findMany({
      where: {
        members: {
          some: {
            userId: validation.userId,
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
        objectives: {
          include: {
            keyResults: true,
          },
        },
        _count: {
          select: {
            objectives: true,
            members: true,
          },
        },
      },
    });

    const formatted = teams.map((team) => {
      const userMembership = team.members.find(
        (m) => m.userId === validation.userId
      );

      // Calculate team progress from key results
      const allKeyResults = team.objectives.flatMap((o) => o.keyResults);
      const krProgressValues = allKeyResults.map((kr) =>
        calculateKRProgress(kr.currentValue, kr.startValue, kr.targetValue)
      );
      const teamProgress =
        krProgressValues.length > 0
          ? krProgressValues.reduce((sum, p) => sum + p, 0) / krProgressValues.length
          : 0;

      return {
        id: team.id,
        name: team.name,
        description: team.description,
        userRole: userMembership?.role || null,
        membersCount: team._count.members,
        objectivesCount: team._count.objectives,
        progress: Math.round(teamProgress),
        members: team.members.map((m) => ({
          userId: m.userId,
          name: m.user.name,
          email: m.user.email,
          role: m.role,
        })),
      };
    });

    return NextResponse.json({
      success: true,
      data: formatted,
      meta: {
        total: formatted.length,
      },
    });
  } catch (error) {
    console.error("Error listing teams:", error);
    return NextResponse.json(
      { success: false, error: "Failed to list teams" },
      { status: 500 }
    );
  }
}
