import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { successResponse, handleApiError, errorResponse } from "@/lib/api-response";
import { updateUserSchema } from "@/lib/validations/user";

/**
 * GET /api/users/[id]
 * Get a single user (admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["ADMIN"]);

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        supervisor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        supervisees: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            bigRocks: true,
            activityLogs: true,
          },
        },
      },
    });

    if (!user) {
      return errorResponse("Usuario no encontrado", 404);
    }

    return successResponse(user);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/users/[id]
 * Update a user (admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["ADMIN"]);

    const { id } = await params;
    const body = await request.json();

    // Validate request body
    const validationResult = updateUserSchema.safeParse({ ...body, id });
    if (!validationResult.success) {
      return handleApiError(new Error(validationResult.error.errors[0].message));
    }

    const { name, role, supervisorId } = validationResult.data;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return errorResponse("Usuario no encontrado", 404);
    }

    // Validate supervisor assignment
    if (supervisorId !== undefined) {
      if (supervisorId === id) {
        return errorResponse("Un usuario no puede ser su propio supervisor", 400);
      }

      if (supervisorId !== null) {
        const supervisor = await prisma.user.findUnique({
          where: { id: supervisorId },
        });

        if (!supervisor) {
          return errorResponse("Supervisor no encontrado", 400);
        }

        // Prevent circular supervision
        const supervisorChain = await checkSupervisorChain(supervisorId, id);
        if (supervisorChain) {
          return errorResponse("Asignacion de supervisor crearia un ciclo", 400);
        }
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(role !== undefined && { role }),
        ...(supervisorId !== undefined && { supervisorId }),
      },
      include: {
        supervisor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return successResponse(updatedUser);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Check if assigning a supervisor would create a circular reference
 */
async function checkSupervisorChain(supervisorId: string, targetUserId: string): Promise<boolean> {
  let currentId: string | null = supervisorId;
  const visited = new Set<string>();

  while (currentId) {
    if (currentId === targetUserId) {
      return true; // Circular reference detected
    }

    if (visited.has(currentId)) {
      break; // Already visited, no need to continue
    }

    visited.add(currentId);

    const foundUser: { supervisorId: string | null } | null = await prisma.user.findUnique({
      where: { id: currentId },
      select: { supervisorId: true },
    });

    currentId = foundUser?.supervisorId || null;
  }

  return false;
}
