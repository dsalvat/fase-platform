import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateAgentRequest } from "../../route";
import { TarStatus } from "@prisma/client";

/**
 * FASE Domain: TAR (Tareas de Alto Rendimiento) Tools
 *
 * MCP-ready: This can become an MCP resource/tool server
 * Resource: fase://tars
 */

// GET /api/agent/fase/tars - List TARs
export async function GET(request: NextRequest) {
  const validation = await validateAgentRequest(request);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const bigRockId = searchParams.get("bigRockId");
  const status = searchParams.get("status") as TarStatus | null;
  const month = searchParams.get("month");

  try {
    const tars = await prisma.tAR.findMany({
      where: {
        bigRock: {
          userId: validation.userId,
          ...(month && { month }),
        },
        ...(bigRockId && { bigRockId }),
        ...(status && { status }),
      },
      include: {
        bigRock: {
          select: {
            id: true,
            title: true,
            month: true,
          },
        },
        activities: {
          select: {
            id: true,
            description: true,
            date: true,
            type: true,
            completed: true,
          },
          orderBy: { date: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = tars.map((tar) => ({
      id: tar.id,
      description: tar.description,
      status: tar.status,
      progress: tar.progress,
      bigRock: tar.bigRock,
      activitiesCount: tar.activities.length,
      completedActivities: tar.activities.filter((a) => a.completed).length,
      activities: tar.activities,
      createdAt: tar.createdAt,
    }));

    return NextResponse.json({
      success: true,
      data: formatted,
      meta: {
        total: formatted.length,
        byStatus: {
          pendiente: formatted.filter((t) => t.status === "PENDIENTE").length,
          enProgreso: formatted.filter((t) => t.status === "EN_PROGRESO").length,
          completada: formatted.filter((t) => t.status === "COMPLETADA").length,
        },
      },
    });
  } catch (error) {
    console.error("Error listing TARs:", error);
    return NextResponse.json(
      { success: false, error: "Failed to list TARs" },
      { status: 500 }
    );
  }
}

// POST /api/agent/fase/tars - Create TAR
export async function POST(request: NextRequest) {
  const validation = await validateAgentRequest(request);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { bigRockId, description } = body;

    if (!bigRockId || !description) {
      return NextResponse.json(
        { success: false, error: "bigRockId and description are required" },
        { status: 400 }
      );
    }

    // Verify Big Rock ownership
    const bigRock = await prisma.bigRock.findFirst({
      where: {
        id: bigRockId,
        userId: validation.userId,
      },
      include: {
        _count: {
          select: { tars: true },
        },
      },
    });

    if (!bigRock) {
      return NextResponse.json(
        { success: false, error: "Big Rock not found" },
        { status: 404 }
      );
    }

    // Check TAR limit
    if (bigRock._count.tars >= bigRock.numTars) {
      return NextResponse.json(
        {
          success: false,
          error: `Big Rock already has ${bigRock.numTars} TARs (maximum reached)`,
        },
        { status: 400 }
      );
    }

    const tar = await prisma.tAR.create({
      data: {
        bigRockId,
        description,
        status: TarStatus.PENDIENTE,
        progress: 0,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: tar.id,
        description: tar.description,
        status: tar.status,
        progress: tar.progress,
        bigRockTitle: bigRock.title,
      },
      message: `TAR created successfully for Big Rock "${bigRock.title}"`,
    });
  } catch (error) {
    console.error("Error creating TAR:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create TAR" },
      { status: 500 }
    );
  }
}
