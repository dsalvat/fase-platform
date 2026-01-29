import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, canAccessTAR, canModifyTAR } from "@/lib/auth";
import { successResponse, handleApiError } from "@/lib/api-response";
import { uuidParamSchema } from "@/lib/validations/big-rock";
import { createActivitySchema, getWeekString } from "@/lib/validations/activity";

/**
 * GET /api/activities
 * List Activities - requires tarId query parameter
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userRole = (user as any).role;
    const { searchParams } = new URL(request.url);

    const tarId = searchParams.get("tarId");

    if (!tarId) {
      return handleApiError(new Error("tarId is required"));
    }

    // Validate tarId
    const idValidation = uuidParamSchema.safeParse(tarId);
    if (!idValidation.success) {
      return handleApiError(new Error("Invalid tarId format"));
    }

    // Check access permissions to the TAR
    const hasAccess = await canAccessTAR(tarId, user.id, userRole);
    if (!hasAccess) {
      return handleApiError(new Error("Forbidden"));
    }

    // Query Activities
    const activities = await prisma.activity.findMany({
      where: {
        tarId,
      },
      orderBy: {
        date: "asc",
      },
    });

    return successResponse(activities);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/activities
 * Create a new Activity
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userRole = (user as any).role;

    const body = await request.json();

    // Calculate week string from date if not provided
    if (body.date && !body.week) {
      body.week = getWeekString(new Date(body.date));
    }

    // Validate with Zod
    const validation = createActivitySchema.safeParse(body);
    if (!validation.success) {
      return handleApiError(new Error(validation.error.errors[0].message));
    }

    const validated = validation.data;

    // Check if user can modify the TAR
    const canModify = await canModifyTAR(validated.tarId, user.id, userRole);
    if (!canModify) {
      return handleApiError(new Error("Forbidden"));
    }

    // Create Activity
    const activity = await prisma.activity.create({
      data: {
        title: validated.title,
        description: validated.description,
        type: validated.type,
        date: validated.date,
        week: validated.week,
        tarId: validated.tarId,
        completed: validated.completed,
        notes: validated.notes,
      },
      include: {
        tar: {
          select: {
            id: true,
            description: true,
            bigRockId: true,
          },
        },
      },
    });

    return successResponse(activity, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
