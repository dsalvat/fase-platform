import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, canAccessActivity, canModifyActivity } from "@/lib/auth";
import { successResponse, handleApiError } from "@/lib/api-response";
import { uuidParamSchema } from "@/lib/validations/big-rock";
import { updateActivitySchema, getWeekString } from "@/lib/validations/activity";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/activities/:id
 * Get a single Activity with full details
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await requireAuth();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userRole = (user as any).role;

    // Validate ID format
    const idValidation = uuidParamSchema.safeParse(id);
    if (!idValidation.success) {
      return handleApiError(new Error("ID invalido"));
    }

    // Check access permissions
    const hasAccess = await canAccessActivity(id, user.id, userRole);
    if (!hasAccess) {
      return handleApiError(new Error("Forbidden"));
    }

    // Fetch Activity with full details
    const activity = await prisma.activity.findUnique({
      where: { id },
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

    if (!activity) {
      return handleApiError(new Error("Activity not found"));
    }

    return successResponse(activity);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/activities/:id
 * Update an Activity
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await requireAuth();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userRole = (user as any).role;

    // Validate ID format
    const idValidation = uuidParamSchema.safeParse(id);
    if (!idValidation.success) {
      return handleApiError(new Error("ID invalido"));
    }

    // Check modify permissions
    const canModify = await canModifyActivity(id, user.id, userRole);
    if (!canModify) {
      return handleApiError(new Error("Forbidden"));
    }

    const body = await request.json();

    // Calculate week string from date if date is being updated
    if (body.date && !body.week) {
      body.week = getWeekString(new Date(body.date));
    }

    // Validate with Zod
    const validation = updateActivitySchema.safeParse({ ...body, id });
    if (!validation.success) {
      return handleApiError(new Error(validation.error.errors[0].message));
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _, ...updateData } = validation.data;

    // Update Activity
    const activity = await prisma.activity.update({
      where: { id },
      data: updateData,
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

    return successResponse(activity);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/activities/:id
 * Delete an Activity
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await requireAuth();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userRole = (user as any).role;

    // Validate ID format
    const idValidation = uuidParamSchema.safeParse(id);
    if (!idValidation.success) {
      return handleApiError(new Error("ID invalido"));
    }

    // Check modify permissions
    const canModify = await canModifyActivity(id, user.id, userRole);
    if (!canModify) {
      return handleApiError(new Error("Forbidden"));
    }

    // Delete Activity
    await prisma.activity.delete({
      where: { id },
    });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
