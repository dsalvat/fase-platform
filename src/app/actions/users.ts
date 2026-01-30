"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { updateUserSchema } from "@/lib/validations/user";
import { UserRole } from "@prisma/client";

/**
 * Server action to update a user's role
 */
export async function updateUserRole(
  userId: string,
  role: UserRole
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireRole(["ADMIN"]);

    await prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    revalidatePath("/admin/usuarios");
    revalidatePath(`/admin/usuarios/${userId}`);

    return { success: true };
  } catch (error) {
    console.error("Error updating user role:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al actualizar el rol",
    };
  }
}

/**
 * Server action to assign a supervisor to a user
 */
export async function assignSupervisor(
  userId: string,
  supervisorId: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireRole(["ADMIN"]);

    // Validate supervisor assignment
    if (supervisorId === userId) {
      return {
        success: false,
        error: "Un usuario no puede ser su propio supervisor",
      };
    }

    if (supervisorId !== null) {
      const supervisor = await prisma.user.findUnique({
        where: { id: supervisorId },
      });

      if (!supervisor) {
        return {
          success: false,
          error: "Supervisor no encontrado",
        };
      }

      // Check for circular reference
      const isCircular = await checkSupervisorChain(supervisorId, userId);
      if (isCircular) {
        return {
          success: false,
          error: "La asignacion crearia una referencia circular",
        };
      }
    }

    await prisma.user.update({
      where: { id: userId },
      data: { supervisorId },
    });

    revalidatePath("/admin/usuarios");
    revalidatePath(`/admin/usuarios/${userId}`);

    return { success: true };
  } catch (error) {
    console.error("Error assigning supervisor:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al asignar supervisor",
    };
  }
}

/**
 * Server action to update user details
 */
export async function updateUser(
  userId: string,
  data: {
    name?: string;
    role?: UserRole;
    supervisorId?: string | null;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireRole(["ADMIN"]);

    const validationResult = updateUserSchema.safeParse({ id: userId, ...data });
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.errors[0].message,
      };
    }

    const { name, role, supervisorId } = validationResult.data;

    // Validate supervisor if provided
    if (supervisorId !== undefined && supervisorId !== null) {
      if (supervisorId === userId) {
        return {
          success: false,
          error: "Un usuario no puede ser su propio supervisor",
        };
      }

      const isCircular = await checkSupervisorChain(supervisorId, userId);
      if (isCircular) {
        return {
          success: false,
          error: "La asignacion crearia una referencia circular",
        };
      }
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name !== undefined && { name }),
        ...(role !== undefined && { role }),
        ...(supervisorId !== undefined && { supervisorId }),
      },
    });

    revalidatePath("/admin/usuarios");
    revalidatePath(`/admin/usuarios/${userId}`);

    return { success: true };
  } catch (error) {
    console.error("Error updating user:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al actualizar usuario",
    };
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
      return true;
    }

    if (visited.has(currentId)) {
      break;
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
