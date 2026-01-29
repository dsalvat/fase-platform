import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, canAccessTAR, canModifyTAR } from "@/lib/auth";
import { successResponse, handleApiError } from "@/lib/api-response";
import { uuidParamSchema } from "@/lib/validations/big-rock";
import { updateTARSchema } from "@/lib/validations/tar";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/tars/:id
 * Get a single TAR with full details including relations
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
    const hasAccess = await canAccessTAR(id, user.id, userRole);
    if (!hasAccess) {
      return handleApiError(new Error("Forbidden"));
    }

    // Fetch TAR with full details
    const tar = await prisma.tAR.findUnique({
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
        activities: {
          orderBy: { date: "asc" },
        },
        keyPeople: true,
      },
    });

    if (!tar) {
      return handleApiError(new Error("TAR not found"));
    }

    return successResponse(tar);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/tars/:id
 * Update a TAR
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

    // Check modify permissions
    const canModify = await canModifyTAR(id, user.id, userRole);
    if (!canModify) {
      return handleApiError(new Error("Forbidden"));
    }

    const body = await request.json();

    // Validate with Zod
    const validation = updateTARSchema.safeParse({ ...body, id });
    if (!validation.success) {
      return handleApiError(new Error(validation.error.errors[0].message));
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _, ...updateData } = validation.data;

    // If setting to COMPLETADA, also set progress to 100
    if (updateData.status === "COMPLETADA" && updateData.progress === undefined) {
      updateData.progress = 100;
    }

    // Update TAR
    const tar = await prisma.tAR.update({
      where: { id },
      data: updateData,
      include: {
        bigRock: {
          select: {
            id: true,
            title: true,
            month: true,
          },
        },
      },
    });

    return successResponse(tar);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/tars/:id
 * Delete a TAR
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

    // Check modify permissions
    const canModify = await canModifyTAR(id, user.id, userRole);
    if (!canModify) {
      return handleApiError(new Error("Forbidden"));
    }

    // Delete TAR (cascades to Activities)
    await prisma.tAR.delete({
      where: { id },
    });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
