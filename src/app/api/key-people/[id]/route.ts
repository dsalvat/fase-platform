import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, canAccessKeyPerson, canModifyKeyPerson } from "@/lib/auth";
import { successResponse, handleApiError } from "@/lib/api-response";
import { updateKeyPersonSchema } from "@/lib/validations/key-person";
import { uuidParamSchema } from "@/lib/validations/big-rock";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/key-people/:id
 * Get a single Key Person with details
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
    const hasAccess = await canAccessKeyPerson(id, user.id, userRole);
    if (!hasAccess) {
      return handleApiError(new Error("Forbidden"));
    }

    // Fetch Key Person with relations
    const keyPerson = await prisma.keyPerson.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        bigRocks: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });

    if (!keyPerson) {
      return handleApiError(new Error("Key Person not found"));
    }

    return successResponse(keyPerson);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/key-people/:id
 * Update a Key Person
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
    const canModify = await canModifyKeyPerson(id, user.id, userRole);
    if (!canModify) {
      return handleApiError(new Error("Forbidden"));
    }

    const body = await request.json();

    // Validate request body
    const validationResult = updateKeyPersonSchema.safeParse({ ...body, id });
    if (!validationResult.success) {
      return handleApiError(new Error(validationResult.error.errors[0].message));
    }

    const { firstName, lastName, role, contact } = validationResult.data;

    // Update Key Person
    const keyPerson = await prisma.keyPerson.update({
      where: { id },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(role !== undefined && { role }),
        ...(contact !== undefined && { contact }),
      },
    });

    return successResponse(keyPerson);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/key-people/:id
 * Delete a Key Person (will automatically unlink from TARs)
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
    const canModify = await canModifyKeyPerson(id, user.id, userRole);
    if (!canModify) {
      return handleApiError(new Error("Forbidden"));
    }

    // Delete Key Person (cascade will handle TAR relations)
    await prisma.keyPerson.delete({
      where: { id },
    });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
