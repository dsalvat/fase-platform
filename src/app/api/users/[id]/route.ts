import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { getCurrentCompanyId } from "@/lib/company-context";
import { checkSupervisorChainInCompany } from "@/lib/supervisor-helpers";
import { successResponse, handleApiError, errorResponse } from "@/lib/api-response";
import { updateUserSchema } from "@/lib/validations/user";
import { UserRole } from "@prisma/client";

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
    const companyId = await getCurrentCompanyId();

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        companies: {
          where: companyId ? { companyId } : undefined,
          select: {
            role: true,
            supervisorId: true,
            supervisor: {
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
            bigRocks: true,
            activityLogs: true,
          },
        },
      },
    });

    if (!user) {
      return errorResponse("Usuario no encontrado", 404);
    }

    // Resolve per-company role and supervisor
    const currentUc = user.companies[0];
    const result = {
      ...user,
      role: currentUc?.role || "USER",
      supervisor: currentUc?.supervisor || null,
    };

    return successResponse(result);
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
    const companyId = await getCurrentCompanyId();

    if (!companyId) {
      return errorResponse("No hay empresa seleccionada", 400);
    }

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
        // Verify supervisor exists in this company
        const supervisorUc = await prisma.userCompany.findUnique({
          where: { userId_companyId: { userId: supervisorId, companyId } },
        });

        if (!supervisorUc) {
          return errorResponse("Supervisor no encontrado en esta empresa", 400);
        }

        // Prevent circular supervision (per-company)
        const isCircular = await checkSupervisorChainInCompany(supervisorId, id, companyId);
        if (isCircular) {
          return errorResponse("Asignacion de supervisor crearia un ciclo", 400);
        }
      }
    }

    // Update name on User (global field)
    if (name !== undefined) {
      await prisma.user.update({
        where: { id },
        data: { name },
      });
    }

    // Update role and supervisor on UserCompany (per-company fields)
    const ucData: { role?: UserRole; supervisorId?: string | null } = {};
    if (role !== undefined) ucData.role = role as UserRole;
    if (supervisorId !== undefined) ucData.supervisorId = supervisorId;

    if (Object.keys(ucData).length > 0) {
      await prisma.userCompany.update({
        where: { userId_companyId: { userId: id, companyId } },
        data: ucData,
      });
    }

    // Return updated user with per-company data
    const updatedUc = await prisma.userCompany.findUnique({
      where: { userId_companyId: { userId: id, companyId } },
      select: {
        role: true,
        supervisor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    const updatedUser = await prisma.user.findUnique({
      where: { id },
    });

    return successResponse({
      ...updatedUser,
      role: updatedUc?.role || "USER",
      supervisor: updatedUc?.supervisor || null,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
