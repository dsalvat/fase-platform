"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { getCurrentCompanyId } from "@/lib/company-context";

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).nullable(),
});

const updateAIContextSchema = z.object({
  contextRole: z.string().max(500).nullable(),
  contextResponsibilities: z.string().max(2000).nullable(),
  contextObjectives: z.string().max(2000).nullable(),
  contextYearPriorities: z.string().max(2000).nullable(),
});

export async function updateProfile(data: {
  name: string | null;
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

    const { name } = validationResult.data;

    // Update user name (global field)
    await prisma.user.update({
      where: { id: session.user.id },
      data: { name },
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

export async function updateAIContext(data: {
  contextRole: string | null;
  contextResponsibilities: string | null;
  contextObjectives: string | null;
  contextYearPriorities: string | null;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return { success: false, error: "No autenticado" };
    }

    const companyId = await getCurrentCompanyId();
    if (!companyId) {
      return { success: false, error: "No se ha seleccionado empresa" };
    }

    const validationResult = updateAIContextSchema.safeParse(data);
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.errors[0].message,
      };
    }

    await prisma.userCompany.update({
      where: {
        userId_companyId: {
          userId: session.user.id,
          companyId,
        },
      },
      data: validationResult.data,
    });

    revalidatePath("/perfil");

    return { success: true };
  } catch (error) {
    console.error("Error updating AI context:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al actualizar el contexto",
    };
  }
}
