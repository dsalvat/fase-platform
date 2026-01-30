"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAuth, canModifyBigRock, canModifyTAR } from "@/lib/auth";
import {
  createTARSchema,
  updateTARSchema,
  updateTARProgressSchema,
  updateTARStatusSchema,
} from "@/lib/validations/tar";
import { TarStatus } from "@prisma/client";
import { recordTARCompleted } from "@/lib/gamification";
import {
  logTARCreated,
  logTARUpdated,
  logTARDeleted,
} from "@/lib/activity-log";

/**
 * Server action to create a new TAR
 * @param formData - Form data from the create form
 * @returns Success response with the created TAR ID
 */
export async function createTAR(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prevState: any,
  formData: FormData
): Promise<{ success: boolean; id?: string; description?: string; error?: string }> {
  try {
    const user = await requireAuth();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userRole = (user as any).role;

    // Extract form data
    const rawData = {
      description: formData.get("description") as string,
      bigRockId: formData.get("bigRockId") as string,
      status: (formData.get("status") as TarStatus) || "PENDIENTE",
      progress: formData.get("progress") ? Number(formData.get("progress")) : 0,
    };

    // Validate with Zod
    const validated = createTARSchema.parse(rawData);

    // Check if user can modify the Big Rock (and thus create TARs for it)
    const canModify = await canModifyBigRock(validated.bigRockId, user.id, userRole);
    if (!canModify) {
      return {
        success: false,
        error: "No tienes permiso para crear TARs para este Big Rock o el mes es de solo lectura",
      };
    }

    // Create TAR in database
    const tar = await prisma.tAR.create({
      data: validated,
      include: {
        bigRock: {
          select: {
            month: true,
          },
        },
      },
    });

    // Record activity log
    try {
      await logTARCreated(user.id, tar.id, tar.description);
    } catch (logError) {
      console.error("Error recording activity log:", logError);
    }

    // Revalidate relevant paths
    revalidatePath(`/big-rocks/${validated.bigRockId}`);
    revalidatePath(`/big-rocks/${validated.bigRockId}/tars`);

    return {
      success: true,
      id: tar.id,
      description: tar.description,
    };
  } catch (error) {
    console.error("Error creating TAR:", error);

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: "Error al crear la TAR",
    };
  }
}

/**
 * Server action to update an existing TAR
 * @param id - ID of the TAR to update
 * @param formData - Form data from the edit form
 * @returns Success response
 */
export async function updateTAR(
  id: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prevState: any,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireAuth();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userRole = (user as any).role;

    // Check if user can modify this TAR
    const canModify = await canModifyTAR(id, user.id, userRole);
    if (!canModify) {
      return {
        success: false,
        error: "No tienes permiso para editar esta TAR o el mes es de solo lectura",
      };
    }

    // Extract form data
    const rawData = {
      id,
      description: formData.get("description") as string | undefined,
      status: formData.get("status") as TarStatus | undefined,
      progress: formData.get("progress") ? Number(formData.get("progress")) : undefined,
    };

    // Validate with Zod
    const validated = updateTARSchema.parse(rawData);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _, ...updateData } = validated;

    // Update TAR in database
    const tar = await prisma.tAR.update({
      where: { id },
      data: updateData,
      include: {
        bigRock: {
          select: {
            id: true,
            userId: true,
          },
        },
      },
    });

    // Record activity log
    try {
      await logTARUpdated(tar.bigRock.userId, tar.id, tar.description, updateData);
    } catch (logError) {
      console.error("Error recording activity log:", logError);
    }

    // Revalidate relevant paths
    revalidatePath(`/big-rocks/${tar.bigRock.id}`);
    revalidatePath(`/big-rocks/${tar.bigRock.id}/tars`);
    revalidatePath(`/big-rocks/${tar.bigRock.id}/tars/${id}`);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error updating TAR:", error);

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: "Error al actualizar la TAR",
    };
  }
}

/**
 * Server action to delete a TAR
 * @param id - ID of the TAR to delete
 * @returns Success response
 */
export async function deleteTAR(id: string): Promise<{
  success: boolean;
  error?: string;
  bigRockId?: string;
}> {
  try {
    const user = await requireAuth();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userRole = (user as any).role;

    // Check if user can modify this TAR
    const canModify = await canModifyTAR(id, user.id, userRole);
    if (!canModify) {
      return {
        success: false,
        error: "No tienes permiso para eliminar esta TAR o el mes es de solo lectura",
      };
    }

    // Get TAR to know the Big Rock for revalidation
    const tar = await prisma.tAR.findUnique({
      where: { id },
      select: { bigRockId: true, description: true, bigRock: { select: { userId: true } } },
    });

    if (!tar) {
      return {
        success: false,
        error: "TAR no encontrada",
      };
    }

    const tarDescription = tar.description;
    const tarOwnerId = tar.bigRock.userId;

    // Delete TAR (cascades to Activities)
    await prisma.tAR.delete({
      where: { id },
    });

    // Record activity log
    try {
      await logTARDeleted(tarOwnerId, id, tarDescription);
    } catch (logError) {
      console.error("Error recording activity log:", logError);
    }

    // Revalidate relevant paths
    revalidatePath(`/big-rocks/${tar.bigRockId}`);
    revalidatePath(`/big-rocks/${tar.bigRockId}/tars`);

    return {
      success: true,
      bigRockId: tar.bigRockId,
    };
  } catch (error) {
    console.error("Error deleting TAR:", error);

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: "Error al eliminar la TAR",
    };
  }
}

/**
 * Server action to update TAR progress
 * @param id - ID of the TAR
 * @param progress - New progress value (0-100)
 * @returns Success response
 */
export async function updateTARProgress(
  id: string,
  progress: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireAuth();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userRole = (user as any).role;

    // Check if user can modify this TAR
    const canModify = await canModifyTAR(id, user.id, userRole);
    if (!canModify) {
      return {
        success: false,
        error: "No tienes permiso para actualizar esta TAR",
      };
    }

    // Validate
    const validated = updateTARProgressSchema.parse({ id, progress });

    // Update TAR progress
    const tar = await prisma.tAR.update({
      where: { id: validated.id },
      data: { progress: validated.progress },
      include: {
        bigRock: {
          select: {
            id: true,
          },
        },
      },
    });

    // Revalidate relevant paths
    revalidatePath(`/big-rocks/${tar.bigRock.id}`);
    revalidatePath(`/big-rocks/${tar.bigRock.id}/tars`);
    revalidatePath(`/big-rocks/${tar.bigRock.id}/tars/${id}`);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error updating TAR progress:", error);

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: "Error al actualizar el progreso",
    };
  }
}

/**
 * Server action to update TAR status
 * @param id - ID of the TAR
 * @param status - New status
 * @returns Success response
 */
export async function updateTARStatus(
  id: string,
  status: TarStatus
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireAuth();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userRole = (user as any).role;

    // Check if user can modify this TAR
    const canModify = await canModifyTAR(id, user.id, userRole);
    if (!canModify) {
      return {
        success: false,
        error: "No tienes permiso para actualizar esta TAR",
      };
    }

    // Validate
    const validated = updateTARStatusSchema.parse({ id, status });

    // Get current TAR status to check if it's changing to COMPLETADA
    const currentTar = await prisma.tAR.findUnique({
      where: { id },
      select: { status: true, bigRock: { select: { userId: true } } },
    });

    const wasNotCompleted = currentTar?.status !== "COMPLETADA";

    // If setting to COMPLETADA, also set progress to 100
    const updateData: { status: TarStatus; progress?: number } = {
      status: validated.status
    };
    if (validated.status === "COMPLETADA") {
      updateData.progress = 100;
    }

    // Update TAR status
    const tar = await prisma.tAR.update({
      where: { id: validated.id },
      data: updateData,
      include: {
        bigRock: {
          select: {
            id: true,
          },
        },
      },
    });

    // Award gamification points if TAR is now completed (and wasn't before)
    if (validated.status === "COMPLETADA" && wasNotCompleted && currentTar?.bigRock?.userId) {
      try {
        await recordTARCompleted(currentTar.bigRock.userId);
      } catch (gamificationError) {
        // Log but don't fail the main operation
        console.error("Error recording gamification:", gamificationError);
      }
    }

    // Revalidate relevant paths
    revalidatePath(`/big-rocks/${tar.bigRock.id}`);
    revalidatePath(`/big-rocks/${tar.bigRock.id}/tars`);
    revalidatePath(`/big-rocks/${tar.bigRock.id}/tars/${id}`);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error updating TAR status:", error);

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
