"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAuth, canModifyTAR, canModifyActivity } from "@/lib/auth";
import {
  createActivitySchema,
  updateActivitySchema,
  getWeekString,
} from "@/lib/validations/activity";
import { ActivityType } from "@prisma/client";
import { recordDailyLog } from "@/lib/gamification";

/**
 * Server action to create a new Activity
 */
export async function createActivity(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prevState: any,
  formData: FormData
): Promise<{ success: boolean; id?: string; title?: string; error?: string }> {
  try {
    const user = await requireAuth();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userRole = (user as any).role;

    // Extract form data
    const dateStr = formData.get("date") as string;
    const rawData = {
      title: formData.get("title") as string,
      description: formData.get("description") as string || null,
      type: formData.get("type") as ActivityType,
      date: new Date(dateStr),
      tarId: formData.get("tarId") as string,
      completed: formData.get("completed") === "true",
      notes: formData.get("notes") as string || null,
    };

    // Calculate week string from date
    const week = getWeekString(rawData.date);

    // Validate with Zod
    const validated = createActivitySchema.parse({ ...rawData, week });

    // Check if user can modify the TAR (and thus create activities for it)
    const canModify = await canModifyTAR(validated.tarId, user.id, userRole);
    if (!canModify) {
      return {
        success: false,
        error: "No tienes permiso para crear actividades para esta TAR o el mes es de solo lectura",
      };
    }

    // Create Activity in database
    const activity = await prisma.activity.create({
      data: {
        title: validated.title,
        description: validated.description,
        type: validated.type,
        date: validated.date,
        week: week,
        tarId: validated.tarId,
        completed: validated.completed,
        notes: validated.notes,
      },
      include: {
        tar: {
          select: {
            bigRockId: true,
          },
        },
      },
    });

    // Revalidate relevant paths
    revalidatePath(`/big-rocks/${activity.tar.bigRockId}/tars/${validated.tarId}`);

    return {
      success: true,
      id: activity.id,
      title: activity.title,
    };
  } catch (error) {
    console.error("Error creating Activity:", error);

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: "Error al crear la actividad",
    };
  }
}

/**
 * Server action to update an existing Activity
 */
export async function updateActivity(
  id: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prevState: any,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireAuth();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userRole = (user as any).role;

    // Check if user can modify this Activity
    const canModify = await canModifyActivity(id, user.id, userRole);
    if (!canModify) {
      return {
        success: false,
        error: "No tienes permiso para editar esta actividad o el mes es de solo lectura",
      };
    }

    // Extract form data
    const dateStr = formData.get("date") as string;
    const rawData: Record<string, unknown> = {
      id,
      title: formData.get("title") as string || undefined,
      description: formData.get("description") as string || null,
      type: formData.get("type") as ActivityType || undefined,
      completed: formData.has("completed") ? formData.get("completed") === "true" : undefined,
      notes: formData.get("notes") as string || null,
    };

    if (dateStr) {
      rawData.date = new Date(dateStr);
      rawData.week = getWeekString(rawData.date as Date);
    }

    // Validate with Zod
    const validated = updateActivitySchema.parse(rawData);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _, ...updateData } = validated;

    // Update Activity in database
    const activity = await prisma.activity.update({
      where: { id },
      data: updateData,
      include: {
        tar: {
          select: {
            id: true,
            bigRockId: true,
          },
        },
      },
    });

    // Revalidate relevant paths
    revalidatePath(`/big-rocks/${activity.tar.bigRockId}/tars/${activity.tar.id}`);
    revalidatePath(`/big-rocks/${activity.tar.bigRockId}/tars/${activity.tar.id}/activities/${id}`);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error updating Activity:", error);

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: "Error al actualizar la actividad",
    };
  }
}

/**
 * Server action to delete an Activity
 */
export async function deleteActivity(id: string): Promise<{
  success: boolean;
  error?: string;
  tarId?: string;
  bigRockId?: string;
}> {
  try {
    const user = await requireAuth();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userRole = (user as any).role;

    // Check if user can modify this Activity
    const canModify = await canModifyActivity(id, user.id, userRole);
    if (!canModify) {
      return {
        success: false,
        error: "No tienes permiso para eliminar esta actividad o el mes es de solo lectura",
      };
    }

    // Get Activity to know the TAR for revalidation
    const activity = await prisma.activity.findUnique({
      where: { id },
      select: {
        tarId: true,
        tar: {
          select: {
            bigRockId: true,
          },
        },
      },
    });

    if (!activity) {
      return {
        success: false,
        error: "Actividad no encontrada",
      };
    }

    // Delete Activity
    await prisma.activity.delete({
      where: { id },
    });

    // Revalidate relevant paths
    revalidatePath(`/big-rocks/${activity.tar.bigRockId}/tars/${activity.tarId}`);

    return {
      success: true,
      tarId: activity.tarId,
      bigRockId: activity.tar.bigRockId,
    };
  } catch (error) {
    console.error("Error deleting Activity:", error);

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: "Error al eliminar la actividad",
    };
  }
}

/**
 * Server action to toggle Activity completion
 */
export async function toggleActivityCompletion(
  id: string,
  completed: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireAuth();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userRole = (user as any).role;

    // Check if user can modify this Activity
    const canModify = await canModifyActivity(id, user.id, userRole);
    if (!canModify) {
      return {
        success: false,
        error: "No tienes permiso para actualizar esta actividad",
      };
    }

    // Update Activity completion
    const activity = await prisma.activity.update({
      where: { id },
      data: { completed },
      include: {
        tar: {
          select: {
            id: true,
            bigRockId: true,
            bigRock: {
              select: {
                userId: true,
              },
            },
          },
        },
      },
    });

    // Award gamification points for completing a daily activity
    if (completed && activity.tar.bigRock?.userId) {
      try {
        await recordDailyLog(activity.tar.bigRock.userId);
      } catch (gamificationError) {
        // Log but don't fail the main operation
        console.error("Error recording gamification:", gamificationError);
      }
    }

    // Revalidate relevant paths
    revalidatePath(`/big-rocks/${activity.tar.bigRockId}/tars/${activity.tar.id}`);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error toggling Activity completion:", error);

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: "Error al actualizar el estado",
    };
  }
}
