"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { getCurrentCompanyId, isSuperAdmin } from "@/lib/company-context";
import { updateUserSchema, inviteUserSchema } from "@/lib/validations/user";
import { UserRole, UserStatus } from "@prisma/client";

/**
 * Server action to update a user's role
 */
export async function updateUserRole(
  userId: string,
  role: UserRole
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireRole([UserRole.ADMIN, UserRole.SUPERADMIN]);

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
    await requireRole([UserRole.ADMIN, UserRole.SUPERADMIN]);

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
    await requireRole([UserRole.ADMIN, UserRole.SUPERADMIN]);

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

/**
 * Server action to invite a new user
 * Creates a user with INVITED status
 */
export async function inviteUser(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prevState: any,
  formData: FormData
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    await requireRole([UserRole.ADMIN, UserRole.SUPERADMIN]);

    const supervisorIdRaw = formData.get("supervisorId") as string | null;
    const rawData = {
      email: formData.get("email") as string,
      name: formData.get("name") as string | null,
      role: (formData.get("role") as UserRole) || "USER",
      supervisorId: supervisorIdRaw === "none" || supervisorIdRaw === "" ? null : supervisorIdRaw,
    };

    // Validate input
    const validationResult = inviteUserSchema.safeParse(rawData);
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.errors[0].message,
      };
    }

    const { email, name, role, supervisorId } = validationResult.data;

    // Get current company ID
    const companyId = await getCurrentCompanyId();
    const superAdmin = await isSuperAdmin();

    // For non-SUPERADMIN users, companyId is required
    if (!superAdmin && !companyId) {
      return {
        success: false,
        error: "No se puede invitar usuarios sin una empresa asignada",
      };
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return {
        success: false,
        error: "Ya existe un usuario con este email",
      };
    }

    // Validate supervisor if provided
    if (supervisorId) {
      const supervisor = await prisma.user.findUnique({
        where: { id: supervisorId },
      });

      if (!supervisor) {
        return {
          success: false,
          error: "Supervisor no encontrado",
        };
      }
    }

    // Create user with INVITED status and company assignment via UserCompany
    const user = await prisma.user.create({
      data: {
        email,
        name: name || null,
        role,
        status: UserStatus.INVITED,
        supervisorId: supervisorId || null,
        currentCompanyId: companyId, // Set current company
        // Create UserCompany relation if company is specified
        ...(companyId && {
          companies: {
            create: {
              companyId: companyId,
            },
          },
        }),
        // Initialize gamification for the user
        gamification: {
          create: {
            points: 0,
            level: 1,
            currentStreak: 0,
            longestStreak: 0,
          },
        },
      },
    });

    revalidatePath("/admin/usuarios");

    return {
      success: true,
      id: user.id,
    };
  } catch (error) {
    console.error("Error inviting user:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al invitar usuario",
    };
  }
}

/**
 * Server action to update user status (activate/deactivate)
 */
export async function updateUserStatus(
  userId: string,
  status: UserStatus
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireRole([UserRole.ADMIN, UserRole.SUPERADMIN]);

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return {
        success: false,
        error: "Usuario no encontrado",
      };
    }

    // Cannot change own status
    // Note: We can get current admin ID from requireRole if needed
    // For now, we just update the status

    await prisma.user.update({
      where: { id: userId },
      data: { status },
    });

    revalidatePath("/admin/usuarios");
    revalidatePath(`/admin/usuarios/${userId}`);

    return { success: true };
  } catch (error) {
    console.error("Error updating user status:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al actualizar estado del usuario",
    };
  }
}

/**
 * Server action to activate a user
 */
export async function activateUser(userId: string): Promise<{ success: boolean; error?: string }> {
  return updateUserStatus(userId, UserStatus.ACTIVE);
}

/**
 * Server action to deactivate a user
 */
export async function deactivateUser(userId: string): Promise<{ success: boolean; error?: string }> {
  return updateUserStatus(userId, UserStatus.DEACTIVATED);
}

/**
 * Server action to add a user to a company (SUPERADMIN only)
 */
export async function addUserToCompany(
  userId: string,
  companyId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireRole([UserRole.SUPERADMIN]);

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return {
        success: false,
        error: "Usuario no encontrado",
      };
    }

    // Verify the company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      return {
        success: false,
        error: "Empresa no encontrada",
      };
    }

    // Check if user is already in this company
    const existingRelation = await prisma.userCompany.findUnique({
      where: {
        userId_companyId: { userId, companyId },
      },
    });

    if (existingRelation) {
      return {
        success: false,
        error: "El usuario ya pertenece a esta empresa",
      };
    }

    // Create UserCompany relation
    await prisma.userCompany.create({
      data: { userId, companyId },
    });

    // If user has no current company, set this as current
    if (!user.currentCompanyId) {
      await prisma.user.update({
        where: { id: userId },
        data: { currentCompanyId: companyId },
      });
    }

    revalidatePath("/admin/usuarios");
    revalidatePath(`/admin/usuarios/${userId}`);

    return { success: true };
  } catch (error) {
    console.error("Error adding user to company:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al agregar usuario a la empresa",
    };
  }
}

/**
 * Server action to remove a user from a company (SUPERADMIN only)
 */
export async function removeUserFromCompany(
  userId: string,
  companyId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireRole([UserRole.SUPERADMIN]);

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        companies: true,
      },
    });

    if (!user) {
      return {
        success: false,
        error: "Usuario no encontrado",
      };
    }

    // Check user has more than one company
    if (user.companies.length <= 1) {
      return {
        success: false,
        error: "El usuario debe pertenecer al menos a una empresa",
      };
    }

    // Delete UserCompany relation
    await prisma.userCompany.delete({
      where: {
        userId_companyId: { userId, companyId },
      },
    });

    // If this was the current company, switch to another
    if (user.currentCompanyId === companyId) {
      const remainingCompany = user.companies.find(uc => uc.companyId !== companyId);
      if (remainingCompany) {
        await prisma.user.update({
          where: { id: userId },
          data: { currentCompanyId: remainingCompany.companyId },
        });
      }
    }

    revalidatePath("/admin/usuarios");
    revalidatePath(`/admin/usuarios/${userId}`);

    return { success: true };
  } catch (error) {
    console.error("Error removing user from company:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al eliminar usuario de la empresa",
    };
  }
}
