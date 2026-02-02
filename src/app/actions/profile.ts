"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { z } from "zod";

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).nullable(),
  supervisorId: z.string().uuid().nullable(),
});

export async function updateProfile(data: {
  name: string | null;
  supervisorId: string | null;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return { success: false, error: "No autenticado" };
    }

    // Validate input
    const validationResult = updateProfileSchema.safeParse(data);
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.errors[0].message,
      };
    }

    const { name, supervisorId } = validationResult.data;

    // Get current user to check role
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!currentUser) {
      return { success: false, error: "Usuario no encontrado" };
    }

    // Only SUPERADMIN can change their own supervisor
    const isSuperAdmin = currentUser.role === UserRole.SUPERADMIN;

    // Prepare update data
    const updateData: { name: string | null; supervisorId?: string | null } = {
      name,
    };

    // Only update supervisor if user is SUPERADMIN
    if (isSuperAdmin) {
      // Validate supervisor exists if provided
      if (supervisorId) {
        const supervisor = await prisma.user.findUnique({
          where: { id: supervisorId },
          select: { id: true },
        });

        if (!supervisor) {
          return { success: false, error: "Supervisor no encontrado" };
        }

        // Prevent circular supervision
        if (supervisorId === session.user.id) {
          return { success: false, error: "No puedes ser tu propio supervisor" };
        }
      }
      updateData.supervisorId = supervisorId;
    }

    // Update user
    await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
    });

    revalidatePath("/perfil");
    revalidatePath("/");

    return { success: true };
  } catch (error) {
    console.error("Error updating profile:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al actualizar el perfil",
    };
  }
}
