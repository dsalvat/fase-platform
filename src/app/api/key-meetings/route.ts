import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, canAccessBigRock, canModifyBigRock } from "@/lib/auth";
import { successResponse, handleApiError } from "@/lib/api-response";
import { createKeyMeetingSchema } from "@/lib/validations/key-meeting";
import { uuidParamSchema } from "@/lib/validations/big-rock";

/**
 * GET /api/key-meetings
 * List Key Meetings for a specific Big Rock
 * Query params:
 * - bigRockId (required): Filter by Big Rock
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userRole = (user as any).role;

    const bigRockId = searchParams.get("bigRockId");

    if (!bigRockId) {
      return handleApiError(new Error("bigRockId es requerido"));
    }

    // Validate bigRockId format
    const idValidation = uuidParamSchema.safeParse(bigRockId);
    if (!idValidation.success) {
      return handleApiError(new Error("ID de Big Rock inválido"));
    }

    // Check access permissions
    const hasAccess = await canAccessBigRock(bigRockId, user.id, userRole);
    if (!hasAccess) {
      return handleApiError(new Error("Forbidden"));
    }

    // Query Key Meetings
    const keyMeetings = await prisma.keyMeeting.findMany({
      where: {
        bigRockId: bigRockId,
      },
      orderBy: {
        date: "asc",
      },
    });

    return successResponse(keyMeetings);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/key-meetings
 * Create a new Key Meeting
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userRole = (user as any).role;

    const body = await request.json();

    // Validate request body
    const validationResult = createKeyMeetingSchema.safeParse(body);
    if (!validationResult.success) {
      return handleApiError(new Error(validationResult.error.errors[0].message));
    }

    const { bigRockId, title, description, date, completed, outcome } = validationResult.data;

    // Check if user can modify the Big Rock
    const canModify = await canModifyBigRock(bigRockId, user.id, userRole);
    if (!canModify) {
      return handleApiError(new Error("Forbidden"));
    }

    // Create Key Meeting
    const keyMeeting = await prisma.keyMeeting.create({
      data: {
        title,
        description: description || null,
        date: new Date(date),
        completed: completed || false,
        outcome: outcome || null,
        bigRockId,
      },
    });

    return successResponse(keyMeeting, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
