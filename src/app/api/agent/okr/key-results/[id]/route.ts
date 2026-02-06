import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateAgentRequest } from "../../../route";
import { TeamMemberRole } from "@prisma/client";

/**
 * OKR Domain: Key Results Tools
 *
 * MCP-ready: This can become an MCP resource/tool server
 * Resource: okr://key-results/{id}
 */

// Helper to calculate progress from KR values
function calculateProgress(current: number, start: number, target: number): number {
  const range = target - start;
  if (range === 0) return current >= target ? 100 : 0;
  return Math.round(Math.min(100, Math.max(0, ((current - start) / range) * 100)));
}

// GET /api/agent/okr/key-results/[id] - Get Key Result details
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
    const keyResult = await prisma.oKRKeyResult.findFirst({
      where: {
        id,
        objective: {
          team: {
            members: {
              some: {
                userId: validation.userId,
              },
            },
          },
        },
      },
      include: {
        objective: {
          select: {
            id: true,
            title: true,
            team: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        activities: {
          orderBy: { createdAt: "asc" },
        },
        updates: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!keyResult) {
      return NextResponse.json(
        { success: false, error: "Key Result not found" },
        { status: 404 }
      );
    }

    const progress = calculateProgress(
      keyResult.currentValue,
      keyResult.startValue,
      keyResult.targetValue
    );

    return NextResponse.json({
      success: true,
      data: {
        id: keyResult.id,
        title: keyResult.title,
        indicator: keyResult.indicator,
        targetValue: keyResult.targetValue,
        currentValue: keyResult.currentValue,
        startValue: keyResult.startValue,
        unit: keyResult.unit,
        progress,
        objective: keyResult.objective,
        activities: keyResult.activities.map((a) => ({
          id: a.id,
          title: a.title,
          completed: a.completed,
        })),
        recentUpdates: keyResult.updates.map((u) => ({
          id: u.id,
          weekNumber: u.weekNumber,
          previousValue: u.previousValue,
          newValue: u.newValue,
          comment: u.comment,
          createdAt: u.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error("Error getting key result:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get key result" },
      { status: 500 }
    );
  }
}

// PATCH /api/agent/okr/key-results/[id] - Update Key Result value
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
    const { currentValue, comment, weekNumber } = body;

    // Verify user has edit permission
    const keyResult = await prisma.oKRKeyResult.findFirst({
      where: {
        id,
        objective: {
          team: {
            members: {
              some: {
                userId: validation.userId,
                role: { in: [TeamMemberRole.RESPONSABLE, TeamMemberRole.EDITOR] },
              },
            },
          },
        },
      },
    });

    if (!keyResult) {
      return NextResponse.json(
        { success: false, error: "Key Result not found or no edit permission" },
        { status: 404 }
      );
    }

    // Calculate week number if not provided (weeks in current quarter)
    const now = new Date();
    const currentWeek = weekNumber || Math.ceil((now.getDate() + now.getDay()) / 7);

    // Update with transaction (create update record + update KR)
    const updated = await prisma.$transaction(async (tx) => {
      // Create or update weekly update record if value changed
      if (currentValue !== undefined && currentValue !== keyResult.currentValue) {
        await tx.oKRKeyResultUpdate.upsert({
          where: {
            keyResultId_weekNumber: {
              keyResultId: id,
              weekNumber: currentWeek,
            },
          },
          create: {
            keyResultId: id,
            weekNumber: currentWeek,
            previousValue: keyResult.currentValue,
            newValue: currentValue,
            comment: comment || "",
          },
          update: {
            previousValue: keyResult.currentValue,
            newValue: currentValue,
            comment: comment || "",
          },
        });
      }

      // Update the key result current value
      const kr = await tx.oKRKeyResult.update({
        where: { id },
        data: {
          ...(currentValue !== undefined && { currentValue }),
        },
      });

      return kr;
    });

    const progress = calculateProgress(
      updated.currentValue,
      updated.startValue,
      updated.targetValue
    );

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        title: updated.title,
        currentValue: updated.currentValue,
        targetValue: updated.targetValue,
        progress,
      },
      message: `Key Result updated: ${updated.currentValue}/${updated.targetValue} ${updated.unit} (${progress}%)`,
    });
  } catch (error) {
    console.error("Error updating key result:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update key result" },
      { status: 500 }
    );
  }
}
