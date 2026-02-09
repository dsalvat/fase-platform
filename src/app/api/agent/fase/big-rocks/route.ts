import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateAgentRequest } from "../../route";
import { BigRockStatus } from "@prisma/client";

/**
 * FASE Domain: Big Rocks Tools
 *
 * MCP-ready: This can become an MCP resource/tool server
 * Resource: fase://big-rocks
 */

// GET /api/agent/fase/big-rocks - List Big Rocks
export async function GET(request: NextRequest) {
  const validation = await validateAgentRequest(request);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");
  const status = searchParams.get("status") as BigRockStatus | null;

  try {
    const bigRocks = await prisma.bigRock.findMany({
      where: {
        userId: validation.userId,
        ...(month && { month }),
        ...(status && { status }),
      },
      include: {
        tars: {
          select: {
            id: true,
            description: true,
            status: true,
            progress: true,
          },
        },
        keyMeetings: {
          select: {
            id: true,
            title: true,
            date: true,
            completed: true,
          },
        },
        keyPeople: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            tars: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Format for agent consumption
    const formatted = bigRocks.map((br) => ({
      id: br.id,
      title: br.title,
      description: br.description,
      indicator: br.indicator,
      category: br.category,
      month: br.month,
      status: br.status,
      numTars: br.numTars,
      actualTars: br._count.tars,
      tars: br.tars,
      keyMeetings: br.keyMeetings,
      keyPeople: br.keyPeople.map((kp) => kp.user),
      createdAt: br.createdAt,
    }));

    return NextResponse.json({
      success: true,
      data: formatted,
      meta: {
        total: formatted.length,
        month: month || "all",
      },
    });
  } catch (error) {
    console.error("Error listing big rocks:", error);
    return NextResponse.json(
      { success: false, error: "Failed to list big rocks" },
      { status: 500 }
    );
  }
}

// POST /api/agent/fase/big-rocks - Create Big Rock
export async function POST(request: NextRequest) {
  const validation = await validateAgentRequest(request);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, description, indicator, numTars, month, category, keyPeople, keyMeetings } = body;

    // Validate required fields
    if (!title || !month) {
      return NextResponse.json(
        { success: false, error: "Title and month are required" },
        { status: 400 }
      );
    }

    // Check if month is open
    const openMonth = await prisma.openMonth.findFirst({
      where: {
        userId: validation.userId,
        month,
      },
    });

    if (!openMonth) {
      return NextResponse.json(
        { success: false, error: `Month ${month} is not open for planning` },
        { status: 400 }
      );
    }

    // Create Big Rock with transaction
    const bigRock = await prisma.$transaction(async (tx) => {
      const br = await tx.bigRock.create({
        data: {
          userId: validation.userId!,
          title,
          description: description || "",
          indicator: indicator || "",
          numTars: numTars || 3,
          month,
          category: category || null,
          status: BigRockStatus.CREADO,
        },
      });

      // Create key people if provided (expects array of user IDs)
      if (keyPeople && Array.isArray(keyPeople)) {
        for (const personId of keyPeople) {
          // Support both {userId: "..."} objects and plain strings
          const userId = typeof personId === "string" ? personId : personId.userId;
          if (userId) {
            await tx.bigRockKeyPerson.create({
              data: {
                bigRockId: br.id,
                userId: userId,
              },
            });
          }
        }
      }

      // Create key meetings if provided
      if (keyMeetings && Array.isArray(keyMeetings)) {
        for (const meeting of keyMeetings) {
          // Date is required for KeyMeeting - default to start of month if not provided
          const meetingDate = meeting.date
            ? new Date(meeting.date)
            : new Date(`${month}-01`);
          await tx.keyMeeting.create({
            data: {
              bigRockId: br.id,
              title: meeting.title,
              date: meetingDate,
              objective: meeting.objective || null,
              expectedDecision: meeting.expectedDecision || null,
            },
          });
        }
      }

      return br;
    });

    return NextResponse.json({
      success: true,
      data: {
        id: bigRock.id,
        title: bigRock.title,
        month: bigRock.month,
        status: bigRock.status,
      },
      message: `Big Rock "${title}" created successfully for ${month}`,
    });
  } catch (error) {
    console.error("Error creating big rock:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create big rock" },
      { status: 500 }
    );
  }
}
