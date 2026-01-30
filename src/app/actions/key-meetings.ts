"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAuth, canModifyBigRock, canModifyKeyMeeting } from "@/lib/auth";
import {
  createKeyMeetingSchema,
  updateKeyMeetingSchema,
} from "@/lib/validations/key-meeting";

/**
 * Server action to create a new Key Meeting
 * @param formData - Form data from the create form
 * @returns Success response with the created Key Meeting ID
 */
export async function createKeyMeeting(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prevState: any,
  formData: FormData
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const user = await requireAuth();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userRole = (user as any).role;

    // Extract form data
    const rawData = {
      title: formData.get("title") as string,
      description: formData.get("description") as string | null,
      date: formData.get("date") as string,
      bigRockId: formData.get("bigRockId") as string,
      completed: formData.get("completed") === "true",
      outcome: formData.get("outcome") as string | null,
    };

    // Validate with Zod
    const validated = createKeyMeetingSchema.parse(rawData);

    // Check if user can modify the Big Rock (and thus create Key Meetings for it)
    const canModify = await canModifyBigRock(validated.bigRockId, user.id, userRole);
    if (!canModify) {
      return {
        success: false,
        error: "No tienes permiso para crear reuniones para este Big Rock o el mes es de solo lectura",
      };
    }

    // Create Key Meeting in database
    const keyMeeting = await prisma.keyMeeting.create({
      data: {
        title: validated.title,
        description: validated.description || null,
        date: new Date(validated.date),
        completed: validated.completed || false,
        outcome: validated.outcome || null,
        bigRockId: validated.bigRockId,
      },
    });

    // Revalidate relevant paths
    revalidatePath(`/big-rocks/${validated.bigRockId}`);
    revalidatePath(`/big-rocks/${validated.bigRockId}/meetings`);

    return {
      success: true,
      id: keyMeeting.id,
    };
  } catch (error) {
    console.error("Error creating Key Meeting:", error);

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: "Error al crear la reunión clave",
    };
  }
}

/**
 * Server action to update an existing Key Meeting
 * @param id - ID of the Key Meeting to update
 * @param formData - Form data from the edit form
 * @returns Success response
 */
export async function updateKeyMeeting(
  id: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prevState: any,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireAuth();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userRole = (user as any).role;

    // Check if user can modify this Key Meeting
    const canModify = await canModifyKeyMeeting(id, user.id, userRole);
    if (!canModify) {
      return {
        success: false,
        error: "No tienes permiso para editar esta reunión o el mes es de solo lectura",
      };
    }

    // Extract form data
    const rawData = {
      id,
      title: formData.get("title") as string | undefined,
      description: formData.get("description") as string | null,
      date: formData.get("date") as string | undefined,
      completed: formData.has("completed") ? formData.get("completed") === "true" : undefined,
      outcome: formData.get("outcome") as string | null,
    };

    // Validate with Zod
    const validated = updateKeyMeetingSchema.parse(rawData);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _, ...updateData } = validated;

    // Build update object
    const dataToUpdate: Record<string, unknown> = {};
    if (updateData.title !== undefined) dataToUpdate.title = updateData.title;
    if (updateData.description !== undefined) dataToUpdate.description = updateData.description;
    if (updateData.date !== undefined) dataToUpdate.date = new Date(updateData.date);
    if (updateData.completed !== undefined) dataToUpdate.completed = updateData.completed;
    if (updateData.outcome !== undefined) dataToUpdate.outcome = updateData.outcome;

    // Update Key Meeting in database
    const keyMeeting = await prisma.keyMeeting.update({
      where: { id },
      data: dataToUpdate,
      include: {
        bigRock: {
          select: {
            id: true,
          },
        },
      },
    });

    // Revalidate relevant paths
    revalidatePath(`/big-rocks/${keyMeeting.bigRock.id}`);
    revalidatePath(`/big-rocks/${keyMeeting.bigRock.id}/meetings`);
    revalidatePath(`/big-rocks/${keyMeeting.bigRock.id}/meetings/${id}`);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error updating Key Meeting:", error);

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: "Error al actualizar la reunión clave",
    };
  }
}

/**
 * Server action to delete a Key Meeting
 * @param id - ID of the Key Meeting to delete
 * @returns Success response
 */
export async function deleteKeyMeeting(id: string): Promise<{
  success: boolean;
  error?: string;
  bigRockId?: string;
}> {
  try {
    const user = await requireAuth();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userRole = (user as any).role;

    // Check if user can modify this Key Meeting
    const canModify = await canModifyKeyMeeting(id, user.id, userRole);
    if (!canModify) {
      return {
        success: false,
        error: "No tienes permiso para eliminar esta reunión o el mes es de solo lectura",
      };
    }

    // Get Key Meeting to know the Big Rock for revalidation
    const keyMeeting = await prisma.keyMeeting.findUnique({
      where: { id },
      select: { bigRockId: true },
    });

    if (!keyMeeting) {
      return {
        success: false,
        error: "Reunión clave no encontrada",
      };
    }

    // Delete Key Meeting
    await prisma.keyMeeting.delete({
      where: { id },
    });

    // Revalidate relevant paths
    revalidatePath(`/big-rocks/${keyMeeting.bigRockId}`);
    revalidatePath(`/big-rocks/${keyMeeting.bigRockId}/meetings`);

    return {
      success: true,
      bigRockId: keyMeeting.bigRockId,
    };
  } catch (error) {
    console.error("Error deleting Key Meeting:", error);

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: "Error al eliminar la reunión clave",
    };
  }
}

/**
 * Server action to toggle Key Meeting completion
 * @param id - ID of the Key Meeting
 * @param completed - New completion status
 * @param outcome - Optional outcome when marking as completed
 * @returns Success response
 */
export async function toggleKeyMeetingCompletion(
  id: string,
  completed: boolean,
  outcome?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireAuth();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userRole = (user as any).role;

    // Check if user can modify this Key Meeting
    const canModify = await canModifyKeyMeeting(id, user.id, userRole);
    if (!canModify) {
      return {
        success: false,
        error: "No tienes permiso para actualizar esta reunión",
      };
    }

    // Update Key Meeting completion
    const keyMeeting = await prisma.keyMeeting.update({
      where: { id },
      data: {
        completed,
        ...(outcome !== undefined && { outcome }),
      },
      include: {
        bigRock: {
          select: {
            id: true,
          },
        },
      },
    });

    // Revalidate relevant paths
    revalidatePath(`/big-rocks/${keyMeeting.bigRock.id}`);
    revalidatePath(`/big-rocks/${keyMeeting.bigRock.id}/meetings`);
    revalidatePath(`/big-rocks/${keyMeeting.bigRock.id}/meetings/${id}`);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error toggling Key Meeting completion:", error);

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: "Error al actualizar el estado de la reunión",
    };
  }
}
