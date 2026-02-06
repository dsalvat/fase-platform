import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateAgentRequest } from "../../../route";
import { TarStatus } from "@prisma/client";

/**
 * FASE Domain: Single TAR Tools
 *
 * MCP-ready: This can become an MCP resource/tool server
 * Resource: fase://tars/{id}
 */

// GET /api/agent/fase/tars/[id] - Get TAR details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const validation = await validateAgentRequest(request);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 401 });
  }

  const { id } = await params;

  try {
    const tar = await prisma.tAR.findFirst({
      where: {
        id,
        bigRock: {
          userId: validation.userId,
        },
      },
      include: {
        bigRock: {
          select: {
            id: true,
            title: true,
            month: true,
            status: true,
          },
        },
        activities: {
          orderBy: { date: "asc" },
        },
      },
    });

    if (!tar) {
      return NextResponse.json(
        { success: false, error: "TAR not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: tar.id,
        description: tar.description,
        status: tar.status,
        progress: tar.progress,
        bigRock: tar.bigRock,
        activities: tar.activities.map((a) => ({
          id: a.id,
          description: a.description,
          date: a.date,
          week: a.week,
          type: a.type,
          completed: a.completed,
        })),
        createdAt: tar.createdAt,
        updatedAt: tar.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error getting TAR:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get TAR" },
      { status: 500 }
    );
  }
}

// PATCH /api/agent/fase/tars/[id] - Update TAR progress/status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const validation = await validateAgentRequest(request);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { description, status, progress } = body;

    // Verify ownership
    const existing = await prisma.tAR.findFirst({
      where: {
        id,
        bigRock: {
          userId: validation.userId,
        },
      },
      include: {
        bigRock: {
          select: { title: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "TAR not found" },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: {
      description?: string;
      status?: TarStatus;
      progress?: number;
    } = {};

    if (description) updateData.description = description;

    if (status) {
      updateData.status = status as TarStatus;
      // Auto-set progress to 100 when completed
      if (status === "COMPLETADA") {
        updateData.progress = 100;
      }
    }

    if (progress !== undefined) {
      updateData.progress = Math.min(100, Math.max(0, progress));
      // Auto-update status based on progress
      if (progress === 100 && !status) {
        updateData.status = TarStatus.COMPLETADA;
      } else if (progress > 0 && progress < 100 && !status) {
        updateData.status = TarStatus.EN_PROGRESO;
      }
    }

    const updated = await prisma.tAR.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        description: updated.description,
        status: updated.status,
        progress: updated.progress,
      },
      message: `TAR updated successfully (${updated.status}, ${updated.progress}% complete)`,
    });
  } catch (error) {
    console.error("Error updating TAR:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update TAR" },
      { status: 500 }
    );
  }
}
