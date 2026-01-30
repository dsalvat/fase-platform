"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAuth, canModifyBigRock } from "@/lib/auth";
import { isMonthReadOnly } from "@/lib/month-helpers";
import {
  createBigRockSchema,
  updateBigRockSchema,
} from "@/lib/validations/big-rock";
import { FaseCategory, BigRockStatus } from "@prisma/client";
import { recordBigRockCreated } from "@/lib/gamification";
import {
  logBigRockCreated,
  logBigRockUpdated,
  logBigRockDeleted,
} from "@/lib/activity-log";

/**
 * Server action to create a new Big Rock
 * @param formData - Form data from the create form
 * @returns Success response with the created Big Rock ID
 */
export async function createBigRock(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prevState: any,
  formData: FormData
): Promise<{ success: boolean; id?: string; title?: string; error?: string }> {
  try {
    const user = await requireAuth();

    // Extract form data
    const rawData = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      category: formData.get("category") as FaseCategory,
      indicator: formData.get("indicator") as string,
      numTars: Number(formData.get("numTars")),
      month: formData.get("month") as string,
      status: (formData.get("status") as BigRockStatus) || "PLANIFICADO",
    };

    // Validate with Zod
    const validated = createBigRockSchema.parse(rawData);

    // Check if month is read-only (past)
    if (isMonthReadOnly(validated.month)) {
      return {
        success: false,
        error: "No se pueden crear Big Rocks para meses pasados",
      };
    }

    // Create Big Rock in database
    const bigRock = await prisma.bigRock.create({
      data: {
        ...validated,
        userId: user.id,
      },
    });

    // Award gamification points for creating a Big Rock
    try {
      await recordBigRockCreated(user.id);
    } catch (gamificationError) {
      // Log but don't fail the main operation
      console.error("Error recording gamification:", gamificationError);
    }

    // Record activity log
    try {
      await logBigRockCreated(user.id, bigRock.id, bigRock.title);
    } catch (logError) {
      console.error("Error recording activity log:", logError);
    }

    // Revalidate relevant paths
    revalidatePath("/big-rocks");
    revalidatePath(`/big-rocks?month=${validated.month}`);

    return {
      success: true,
      id: bigRock.id,
      title: bigRock.title,
    };
  } catch (error) {
    console.error("Error creating Big Rock:", error);

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: "Error al crear el Big Rock",
    };
  }
}

/**
 * Server action to update an existing Big Rock
 * @param id - ID of the Big Rock to update
 * @param formData - Form data from the edit form
 * @returns Success response
 */
export async function updateBigRock(
  id: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prevState: any,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireAuth();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userRole = (user as any).role;

    // Check if user can modify this Big Rock
    const canModify = await canModifyBigRock(id, user.id, userRole);
    if (!canModify) {
      return {
        success: false,
        error: "No tienes permiso para editar este Big Rock o el mes es de solo lectura",
      };
    }

    // Extract form data
    const rawData = {
      id,
      title: formData.get("title") as string | undefined,
      description: formData.get("description") as string | undefined,
      category: formData.get("category") as FaseCategory | undefined,
      indicator: formData.get("indicator") as string | undefined,
      numTars: formData.get("numTars") ? Number(formData.get("numTars")) : undefined,
      status: formData.get("status") as BigRockStatus | undefined,
    };

    // Validate with Zod
    const validated = updateBigRockSchema.parse(rawData);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _, ...updateData } = validated;

    // Update Big Rock in database
    const bigRock = await prisma.bigRock.update({
      where: { id },
      data: updateData,
    });

    // Record activity log
    try {
      await logBigRockUpdated(user.id, bigRock.id, bigRock.title, updateData);
    } catch (logError) {
      console.error("Error recording activity log:", logError);
    }

    // Revalidate relevant paths
    revalidatePath("/big-rocks");
    revalidatePath(`/big-rocks?month=${bigRock.month}`);
    revalidatePath(`/big-rocks/${id}`);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error updating Big Rock:", error);

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: "Error al actualizar el Big Rock",
    };
  }
}

/**
 * Server action to delete a Big Rock
 * @param id - ID of the Big Rock to delete
 * @returns Success response
 */
export async function deleteBigRock(id: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const user = await requireAuth();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userRole = (user as any).role;

    // Check if user can modify this Big Rock
    const canModify = await canModifyBigRock(id, user.id, userRole);
    if (!canModify) {
      return {
        success: false,
        error: "No tienes permiso para eliminar este Big Rock o el mes es de solo lectura",
      };
    }

    // Get Big Rock to know the month for revalidation
    const bigRock = await prisma.bigRock.findUnique({
      where: { id },
      select: { month: true, title: true },
    });

    if (!bigRock) {
      return {
        success: false,
        error: "Big Rock no encontrado",
      };
    }

    const bigRockTitle = bigRock.title;

    // Delete Big Rock (cascades to TARs and KeyMeetings)
    await prisma.bigRock.delete({
      where: { id },
    });

    // Record activity log
    try {
      await logBigRockDeleted(user.id, id, bigRockTitle);
    } catch (logError) {
      console.error("Error recording activity log:", logError);
    }

    // Revalidate relevant paths
    revalidatePath("/big-rocks");
    revalidatePath(`/big-rocks?month=${bigRock.month}`);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error deleting Big Rock:", error);

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: "Error al eliminar el Big Rock",
    };
  }
}
