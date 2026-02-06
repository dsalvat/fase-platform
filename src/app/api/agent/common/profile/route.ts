import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateAgentRequest } from "../../route";

/**
 * Common Domain: User Profile Tools
 *
 * MCP-ready: This can become an MCP resource/tool server
 * Resource: common://profile
 */

// GET /api/agent/common/profile - Get user profile and context
export async function GET(request: NextRequest) {
  const validation = await validateAgentRequest(request);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: validation.userId },
      include: {
        companies: {
          include: {
            company: {
              select: {
                id: true,
                name: true,
                logo: true,
              },
            },
          },
        },
        apps: {
          include: {
            app: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        },
        supervisor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            supervisees: true,
            bigRocks: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Get user's teams for OKR
    const teamMemberships = await prisma.teamMember.findMany({
      where: { userId: validation.userId },
      include: {
        team: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Get open months
    const openMonths = await prisma.openMonth.findMany({
      where: { userId: validation.userId },
      orderBy: { month: "desc" },
      take: 3,
    });

    // Determine available apps
    const availableApps = user.apps.map((ua) => ua.app.code);

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        company: user.companies[0]?.company || null,
        supervisor: user.supervisor,
        superviseeCount: user._count.supervisees,
        bigRockCount: user._count.bigRocks,
        apps: {
          available: availableApps,
          hasFASE: availableApps.includes("FASE"),
          hasOKR: availableApps.includes("OKR"),
        },
        teams: teamMemberships.map((tm) => ({
          id: tm.team.id,
          name: tm.team.name,
          role: tm.role,
        })),
        planning: {
          openMonths: openMonths.map((om) => ({
            month: om.month,
            isConfirmed: om.isPlanningConfirmed,
          })),
          currentMonth: new Date().toISOString().slice(0, 7),
        },
      },
    });
  } catch (error) {
    console.error("Error getting user profile:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get user profile" },
      { status: 500 }
    );
  }
}
