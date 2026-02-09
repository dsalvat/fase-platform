"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { z } from "zod";

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).nullable(),
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
