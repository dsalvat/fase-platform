import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateAgentRequest } from "../../../route";

/**
 * FASE Domain: Single Big Rock Tools
 *
 * MCP-ready: This can become an MCP resource/tool server
 * Resource: fase://big-rocks/{id}
 */

// GET /api/agent/fase/big-rocks/[id] - Get Big Rock details
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
    const bigRock = await prisma.bigRock.findFirst({
      where: {
        id,
        userId: validation.userId,
      },
      include: {
        tars: {
          include: {
            activities: {
              orderBy: { date: "asc" },
            },
          },
        },
        keyMeetings: true,
        keyPeople: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!bigRock) {
      return NextResponse.json(
        { success: false, error: "Big Rock not found" },
        { status: 404 }
      );
    }

    // Calculate overall progress
    const totalProgress = bigRock.tars.length > 0
      ? bigRock.tars.reduce((sum, tar) => sum + tar.progress, 0) / bigRock.tars.length
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        id: bigRock.id,
        title: bigRock.title,
        description: bigRock.description,
        indicator: bigRock.indicator,
        category: bigRock.category,
        month: bigRock.month,
        status: bigRock.status,
        numTars: bigRock.numTars,
        progress: Math.round(totalProgress),
        tars: bigRock.tars.map((tar) => ({
          id: tar.id,
          description: tar.description,
          status: tar.status,
          progress: tar.progress,
          activitiesCount: tar.activities.length,
          completedActivities: tar.activities.filter((a) => a.completed).length,
        })),
        keyMeetings: bigRock.keyMeetings.map((km) => ({
          id: km.id,
          title: km.title,
          date: km.date,
          objective: km.objective,
          expectedDecision: km.expectedDecision,
          isCompleted: km.completed,
          outcome: km.outcome,
        })),
        keyPeople: bigRock.keyPeople.map((kp) => ({
          id: kp.user.id,
          name: kp.user.name,
        })),
        createdAt: bigRock.createdAt,
        updatedAt: bigRock.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error getting big rock:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get big rock" },
      { status: 500 }
    );
  }
}

// PATCH /api/agent/fase/big-rocks/[id] - Update Big Rock
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
    const { title, description, indicator, numTars, category } = body;

    // Verify ownership
    const existing = await prisma.bigRock.findFirst({
      where: {
        id,
        userId: validation.userId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Big Rock not found" },
        { status: 404 }
      );
    }

    const updated = await prisma.bigRock.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(indicator !== undefined && { indicator }),
        ...(numTars && { numTars }),
        ...(category !== undefined && { category: category || null }),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        title: updated.title,
        status: updated.status,
      },
      message: `Big Rock "${updated.title}" updated successfully`,
    });
  } catch (error) {
    console.error("Error updating big rock:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update big rock" },
      { status: 500 }
    );
  }
}
