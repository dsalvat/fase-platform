"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAuth, canGiveFeedback } from "@/lib/auth";
import { feedbackSchema } from "@/lib/validations/feedback";
import { FeedbackTargetType, UserRole } from "@prisma/client";
import type { FeedbackWithSupervisor } from "@/types/feedback";

/**
 * Create or update feedback for a Big Rock or Month Planning
 * Only supervisors can give feedback to their supervisees
 */
export async function createFeedback(
  targetType: FeedbackTargetType,
  targetId: string,
  comment: string,
  rating?: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireAuth();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userRole = (user as any).role as UserRole;

    // Validate input
    const validated = feedbackSchema.parse({
      targetType,
      targetId,
      comment,
      rating,
    });

    // Check permissions
    if (userRole !== "SUPERVISOR" && userRole !== "ADMIN" && userRole !== "SUPERADMIN") {
      return {
        success: false,
        error: "Solo los supervisores pueden dar feedback",
      };
    }

    const canFeedback = await canGiveFeedback(user.id, targetType, targetId);
    if (!canFeedback && userRole !== "ADMIN" && userRole !== "SUPERADMIN") {
      return {
        success: false,
        error: "No tienes permiso para dar feedback a este objetivo",
      };
    }

    // Get the user ID of the target owner
    let targetUserId: string;

    if (targetType === "BIG_ROCK") {
      const bigRock = await prisma.bigRock.findUnique({
        where: { id: targetId },
        select: { userId: true, month: true },
      });

      if (!bigRock) {
        return {
          success: false,
          error: "Big Rock no encontrado",
        };
      }

      targetUserId = bigRock.userId;
    } else {
      const openMonth = await prisma.openMonth.findUnique({
        where: { id: targetId },
        select: { userId: true },
      });

      if (!openMonth) {
        return {
          success: false,
          error: "Planificacion del mes no encontrada",
        };
      }

      targetUserId = openMonth.userId;
    }

    // Upsert feedback
    await prisma.feedback.upsert({
      where: {
        targetType_targetId: {
          targetType: validated.targetType as FeedbackTargetType,
          targetId: validated.targetId,
        },
      },
      update: {
        comment: validated.comment,
        rating: validated.rating,
        supervisorId: user.id,
        updatedAt: new Date(),
      },
      create: {
        targetType: validated.targetType as FeedbackTargetType,
        targetId: validated.targetId,
        comment: validated.comment,
        rating: validated.rating,
        supervisorId: user.id,
        userId: targetUserId,
      },
    });

    // Revalidate relevant paths
    if (targetType === "BIG_ROCK") {
      revalidatePath(`/big-rocks/${targetId}`);
    }
    revalidatePath("/supervisor");

    return { success: true };
  } catch (error) {
    console.error("Error creating feedback:", error);

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: "Error al guardar el feedback",
    };
  }
}

/**
 * Get feedback for a specific Big Rock
 */
export async function getBigRockFeedback(
  bigRockId: string
): Promise<FeedbackWithSupervisor | null> {
  const user = await requireAuth();

  // Get the Big Rock to verify access
  const bigRock = await prisma.bigRock.findUnique({
    where: { id: bigRockId },
    select: { userId: true },
  });

  if (!bigRock) {
    return null;
  }

  // Only owner can see their feedback
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userRole = (user as any).role as UserRole;
  if (bigRock.userId !== user.id && userRole !== "ADMIN" && userRole !== "SUPERADMIN") {
    // Check if user is the supervisor
    const supervisee = await prisma.user.findFirst({
      where: {
        id: bigRock.userId,
        supervisorId: user.id,
      },
    });

    if (!supervisee) {
      return null;
    }
  }

  const feedback = await prisma.feedback.findFirst({
    where: {
      targetType: "BIG_ROCK",
      targetId: bigRockId,
    },
    include: {
      supervisor: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return feedback;
}

/**
 * Get feedback for a specific month planning
 */
export async function getMonthFeedback(
  month: string,
  userId: string
): Promise<FeedbackWithSupervisor | null> {
  const user = await requireAuth();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userRole = (user as any).role as UserRole;

  // Only owner or supervisor can see the feedback
  if (userId !== user.id && userRole !== "ADMIN" && userRole !== "SUPERADMIN") {
    // Check if user is the supervisor
    const supervisee = await prisma.user.findFirst({
      where: {
        id: userId,
        supervisorId: user.id,
      },
    });

    if (!supervisee) {
      return null;
    }
  }

  // Get the OpenMonth record
  const openMonth = await prisma.openMonth.findFirst({
    where: {
      userId: userId,
      month: month,
    },
    select: { id: true },
  });

  if (!openMonth) {
    return null;
  }

  const feedback = await prisma.feedback.findFirst({
    where: {
      targetType: "MONTH_PLANNING",
      targetId: openMonth.id,
    },
    include: {
      supervisor: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return feedback;
}

/**
 * Delete feedback (only the supervisor who created it can delete)
 */
export async function deleteFeedback(
  feedbackId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireAuth();

    const feedback = await prisma.feedback.findUnique({
      where: { id: feedbackId },
      select: { supervisorId: true, targetType: true, targetId: true },
    });

    if (!feedback) {
      return {
        success: false,
        error: "Feedback no encontrado",
      };
    }

    // Only the supervisor who created it can delete
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userRole = (user as any).role as UserRole;
    if (feedback.supervisorId !== user.id && userRole !== "ADMIN" && userRole !== "SUPERADMIN") {
      return {
        success: false,
        error: "No tienes permiso para eliminar este feedback",
      };
    }

    await prisma.feedback.delete({
      where: { id: feedbackId },
    });

    // Revalidate relevant paths
    if (feedback.targetType === "BIG_ROCK") {
      revalidatePath(`/big-rocks/${feedback.targetId}`);
    }
    revalidatePath("/supervisor");

    return { success: true };
  } catch (error) {
    console.error("Error deleting feedback:", error);
    return {
      success: false,
      error: "Error al eliminar el feedback",
    };
  }
}
