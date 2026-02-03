"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

/**
 * Mark the onboarding as completed for the current user.
 * Called when user completes or skips the onboarding tour.
 */
export async function markOnboardingComplete(): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireAuth();

    await prisma.user.update({
      where: { id: user.id },
      data: { onboardingCompletedAt: new Date() },
    });

    revalidatePath("/");
    revalidatePath("/home");
    revalidatePath("/big-rocks");

    return { success: true };
  } catch (error) {
    console.error("Error marking onboarding complete:", error);
    return {
      success: false,
      error: "Error al completar el onboarding",
    };
  }
}

/**
 * Reset onboarding for a user (admin only).
 * Useful for testing or allowing users to see the tour again.
 */
export async function resetOnboarding(userId?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await requireAuth();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userRole = (currentUser as any).role;

    // Only admins can reset onboarding
    if (userRole !== "ADMIN" && userRole !== "SUPERADMIN") {
      return {
        success: false,
        error: "No tienes permiso para reiniciar el onboarding",
      };
    }

    const targetUserId = userId || currentUser.id;

    await prisma.user.update({
      where: { id: targetUserId },
      data: { onboardingCompletedAt: null },
    });

    revalidatePath("/");

    return { success: true };
  } catch (error) {
    console.error("Error resetting onboarding:", error);
    return {
      success: false,
      error: "Error al reiniciar el onboarding",
    };
  }
}
