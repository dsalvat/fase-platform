import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, canAccessKeyMeeting, canModifyKeyMeeting } from "@/lib/auth";
import { successResponse, handleApiError } from "@/lib/api-response";
import { updateKeyMeetingSchema } from "@/lib/validations/key-meeting";
import { uuidParamSchema } from "@/lib/validations/big-rock";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/key-meetings/:id
 * Get a single Key Meeting with details
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
      return handleApiError(new Error("ID inválido"));
    }

    // Check access permissions
    const hasAccess = await canAccessKeyMeeting(id, user.id, userRole);
    if (!hasAccess) {
      return handleApiError(new Error("Forbidden"));
    }

    // Fetch Key Meeting with BigRock details
    const keyMeeting = await prisma.keyMeeting.findUnique({
      where: { id },
      include: {
        bigRock: {
          select: {
            id: true,
            title: true,
            month: true,
            userId: true,
          },
        },
      },
    });

    if (!keyMeeting) {
      return handleApiError(new Error("Key Meeting not found"));
    }

    return successResponse(keyMeeting);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/key-meetings/:id
 * Update a Key Meeting
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
      return handleApiError(new Error("ID inválido"));
    }

    // Check modification permissions
    const canModify = await canModifyKeyMeeting(id, user.id, userRole);
    if (!canModify) {
      return handleApiError(new Error("Forbidden"));
    }

    const body = await request.json();

    // Validate request body
    const validationResult = updateKeyMeetingSchema.safeParse({ ...body, id });
    if (!validationResult.success) {
      return handleApiError(new Error(validationResult.error.errors[0].message));
    }

    const { title, description, date, completed, outcome } = validationResult.data;

    // Update Key Meeting
    const keyMeeting = await prisma.keyMeeting.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(date !== undefined && { date: new Date(date) }),
        ...(completed !== undefined && { completed }),
        ...(outcome !== undefined && { outcome }),
      },
    });

    return successResponse(keyMeeting);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/key-meetings/:id
 * Delete a Key Meeting
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
      return handleApiError(new Error("ID inválido"));
    }

    // Check modification permissions
    const canModify = await canModifyKeyMeeting(id, user.id, userRole);
    if (!canModify) {
      return handleApiError(new Error("Forbidden"));
    }

    // Delete Key Meeting
    await prisma.keyMeeting.delete({
      where: { id },
    });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
