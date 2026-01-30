import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, canAccessBigRock, canModifyBigRock } from "@/lib/auth";
import { successResponse, handleApiError } from "@/lib/api-response";
import { uuidParamSchema, updateBigRockSchema } from "@/lib/validations/big-rock";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/big-rocks/:id
 * Get a single Big Rock with full details including relations
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

    const bigRockId = id;

    // Check access permissions
    const hasAccess = await canAccessBigRock(bigRockId, user.id, userRole);
    if (!hasAccess) {
      return handleApiError(new Error("Forbidden"));
    }

    // Fetch Big Rock with full details
    const bigRock = await prisma.bigRock.findUnique({
      where: { id: bigRockId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tars: {
          orderBy: { createdAt: "asc" },
        },
        keyMeetings: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!bigRock) {
      return handleApiError(new Error("Big Rock not found"));
    }

    return successResponse(bigRock);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PUT /api/big-rocks/:id
 * Update a Big Rock
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
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

    // Check modification permissions
    const canModify = await canModifyBigRock(id, user.id, userRole);
    if (!canModify) {
      return handleApiError(new Error("Forbidden"));
    }

    const body = await request.json();

    // Validate request body
    const validationResult = updateBigRockSchema.safeParse({ ...body, id });
    if (!validationResult.success) {
      return handleApiError(new Error(validationResult.error.errors[0].message));
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _, ...updateData } = validationResult.data;

    // Update Big Rock
    const bigRock = await prisma.bigRock.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tars: {
          orderBy: { createdAt: "asc" },
        },
        keyMeetings: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return successResponse(bigRock);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/big-rocks/:id
 * Partial update a Big Rock (alias for PUT)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return PUT(request, { params });
}

/**
 * DELETE /api/big-rocks/:id
 * Delete a Big Rock
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

    // Check modification permissions
    const canModify = await canModifyBigRock(id, user.id, userRole);
    if (!canModify) {
      return handleApiError(new Error("Forbidden"));
    }

    // Delete Big Rock (cascades to TARs and KeyMeetings)
    await prisma.bigRock.delete({
      where: { id },
    });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
