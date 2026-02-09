"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAuth, canModifyBigRock } from "@/lib/auth";
import { getCurrentCompanyId } from "@/lib/company-context";
import { isMonthReadOnly } from "@/lib/month-helpers";
import {
  createBigRockSchema,
  updateBigRockSchema,
} from "@/lib/validations/big-rock";
import { BigRockStatus, FaseCategory, UserRole } from "@prisma/client";
import { recordBigRockCreated } from "@/lib/gamification";
import { evaluateBigRock } from "@/lib/ai-evaluation";
import {
  logBigRockCreated,
  logBigRockUpdated,
  logBigRockDeleted,
  logKeyMeetingCreated,
} from "@/lib/activity-log";
import { InlineKeyMeeting } from "@/types/inline-forms";

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
    const companyId = await getCurrentCompanyId();

    // Extract form data
    const categoryRaw = formData.get("category") as string | null;
    const category = categoryRaw && categoryRaw !== "none"
      ? categoryRaw as FaseCategory
      : null;

    const rawData = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      indicator: formData.get("indicator") as string,
      numTars: Number(formData.get("numTars")),
      month: formData.get("month") as string,
      status: (formData.get("status") as BigRockStatus) || "CREADO",
      category,
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

    // Extract key people (user IDs) and meetings data
    let keyPeopleUserIds: string[] = [];
    let keyMeetings: InlineKeyMeeting[] = [];

    try {
      const keyPeopleIdsStr = formData.get("keyPeopleIds") as string;
      if (keyPeopleIdsStr) {
        keyPeopleUserIds = JSON.parse(keyPeopleIdsStr);
      }
    } catch {
      // Ignore parsing errors
    }

    try {
      const keyMeetingsStr = formData.get("keyMeetings") as string;
      if (keyMeetingsStr) {
        keyMeetings = JSON.parse(keyMeetingsStr);
      }
    } catch {
      // Ignore parsing errors
    }

    // Verify that all keyPeopleUserIds are valid users with FASE app access in the same company
    if (keyPeopleUserIds.length > 0 && companyId) {
      const validUsers = await prisma.user.findMany({
        where: {
          id: { in: keyPeopleUserIds },
          companies: {
            some: { companyId: companyId },
          },
          apps: {
            some: {
              app: { code: "FASE" },
            },
          },
        },
        select: { id: true },
      });
      const validIds = new Set(validUsers.map(u => u.id));
      keyPeopleUserIds = keyPeopleUserIds.filter(id => validIds.has(id));
    }

    // Create BigRock with relations in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create BigRock
      const bigRock = await tx.bigRock.create({
        data: {
          ...validated,
          userId: user.id,
          companyId: companyId,
        },
      });

      // 2. Create BigRockKeyPerson entries for selected users
      if (keyPeopleUserIds.length > 0) {
        await tx.bigRockKeyPerson.createMany({
          data: keyPeopleUserIds.map(userId => ({
            bigRockId: bigRock.id,
            userId: userId,
          })),
        });
      }

      // 3. Create KeyMeetings linked to the BigRock
      for (const meeting of keyMeetings) {
        const newMeeting = await tx.keyMeeting.create({
          data: {
            title: meeting.title,
            objective: meeting.objective || null,
            expectedDecision: meeting.expectedDecision || null,
            date: new Date(meeting.date),
            description: meeting.description || null,
            bigRockId: bigRock.id,
          },
        });

        // Log key meeting creation
        try {
          await logKeyMeetingCreated(user.id, newMeeting.id, newMeeting.title);
        } catch (logError) {
          console.error("Error recording activity log:", logError);
        }
      }

      return bigRock;
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
      await logBigRockCreated(user.id, result.id, result.title);
    } catch (logError) {
      console.error("Error recording activity log:", logError);
    }

    // Revalidate relevant paths
    revalidatePath("/big-rocks");
    revalidatePath(`/big-rocks?month=${validated.month}`);

    return {
      success: true,
      id: result.id,
      title: result.title,
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
    const companyId = await getCurrentCompanyId();
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
    const categoryRaw = formData.get("category") as string | null;
    const category = categoryRaw === "none" ? null : categoryRaw as FaseCategory | null;

    const rawData = {
      id,
      title: formData.get("title") as string | undefined,
      description: formData.get("description") as string | undefined,
      indicator: formData.get("indicator") as string | undefined,
      numTars: formData.get("numTars") ? Number(formData.get("numTars")) : undefined,
      status: formData.get("status") as BigRockStatus | undefined,
      ...(formData.has("category") && { category }),
    };

    // Validate with Zod
    const validated = updateBigRockSchema.parse(rawData);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _, ...updateData } = validated;

    // Extract key people (user IDs) and meetings data
    let keyPeopleUserIds: string[] | null = null;
    let keyMeetings: InlineKeyMeeting[] | null = null;

    // Check if keyPeopleIds field is present (indicates we should update keyPeople)
    if (formData.has("keyPeopleIds")) {
      try {
        const keyPeopleIdsStr = formData.get("keyPeopleIds") as string;
        keyPeopleUserIds = keyPeopleIdsStr ? JSON.parse(keyPeopleIdsStr) : [];
      } catch {
        keyPeopleUserIds = [];
      }
    }

    // Check if keyMeetings field is present (indicates we should update keyMeetings)
    if (formData.has("keyMeetings")) {
      try {
        const keyMeetingsStr = formData.get("keyMeetings") as string;
        keyMeetings = keyMeetingsStr ? JSON.parse(keyMeetingsStr) : [];
      } catch {
        keyMeetings = [];
      }
    }

    // Verify that all keyPeopleUserIds are valid users with FASE app access in the same company
    if (keyPeopleUserIds !== null && keyPeopleUserIds.length > 0 && companyId) {
      const validUsers = await prisma.user.findMany({
        where: {
          id: { in: keyPeopleUserIds },
          companies: {
            some: { companyId: companyId },
          },
          apps: {
            some: {
              app: { code: "FASE" },
            },
          },
        },
        select: { id: true },
      });
      const validIds = new Set(validUsers.map(u => u.id));
      keyPeopleUserIds = keyPeopleUserIds.filter(uid => validIds.has(uid));
    }

    // Update BigRock with relations in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update BigRock
      const bigRock = await tx.bigRock.update({
        where: { id },
        data: updateData,
      });

      // 2. Handle key people (users) if specified
      if (keyPeopleUserIds !== null) {
        // Delete existing key people relations
        await tx.bigRockKeyPerson.deleteMany({
          where: { bigRockId: id },
        });

        // Create new key people relations
        if (keyPeopleUserIds.length > 0) {
          await tx.bigRockKeyPerson.createMany({
            data: keyPeopleUserIds.map(userId => ({
              bigRockId: bigRock.id,
              userId: userId,
            })),
          });
        }
      }

      // 3. Handle KeyMeetings if provided
      if (keyMeetings !== null) {
        // Delete existing keyMeetings for this BigRock
        await tx.keyMeeting.deleteMany({
          where: { bigRockId: id },
        });

        // Create new KeyMeetings
        for (const meeting of keyMeetings) {
          const newMeeting = await tx.keyMeeting.create({
            data: {
              title: meeting.title,
              objective: meeting.objective || null,
              expectedDecision: meeting.expectedDecision || null,
              date: new Date(meeting.date),
              description: meeting.description || null,
              bigRockId: bigRock.id,
            },
          });

          // Log key meeting creation
          try {
            await logKeyMeetingCreated(user.id, newMeeting.id, newMeeting.title);
          } catch (logError) {
            console.error("Error recording activity log:", logError);
          }
        }
      }

      return bigRock;
    });

    // Record activity log
    try {
      await logBigRockUpdated(user.id, result.id, result.title, updateData);
    } catch (logError) {
      console.error("Error recording activity log:", logError);
    }

    // Revalidate relevant paths
    revalidatePath("/big-rocks");
    revalidatePath(`/big-rocks?month=${result.month}`);
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

    // Delete Big Rock (cascades to TARs, KeyMeetings, and BigRockKeyPerson)
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

/**
 * Server action to confirm a Big Rock
 * Changes status from CREADO to CONFIRMADO
 * Once confirmed, only TARs, Key Meetings, and Key People can be edited
 * @param id - ID of the Big Rock to confirm
 * @returns Success response
 */
export async function confirmBigRock(id: string): Promise<{
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
        error: "No tienes permiso para confirmar este Big Rock",
      };
    }

    // Get Big Rock to validate
    const bigRock = await prisma.bigRock.findUnique({
      where: { id },
      select: {
        status: true,
        month: true,
        title: true,
        description: true,
        indicator: true,
      },
    });

    if (!bigRock) {
      return {
        success: false,
        error: "Big Rock no encontrado",
      };
    }

    // Can only confirm if status is CREADO
    if (bigRock.status !== "CREADO") {
      return {
        success: false,
        error: "Este Big Rock ya ha sido confirmado",
      };
    }

    // Validate that all required fields are filled
    if (!bigRock.title || !bigRock.description || !bigRock.indicator) {
      return {
        success: false,
        error: "Completa todos los campos requeridos antes de confirmar",
      };
    }

    // Confirm the Big Rock - change status to CONFIRMADO
    await prisma.bigRock.update({
      where: { id },
      data: { status: "CONFIRMADO" },
    });

    // Record activity log
    try {
      await logBigRockUpdated(user.id, id, bigRock.title, { status: "CONFIRMADO" });
    } catch (logError) {
      console.error("Error recording activity log:", logError);
    }

    // AI evaluation (non-critical, errors don't block confirmation)
    try {
      await evaluateBigRock(id);
    } catch (aiError) {
      console.error("Error during AI evaluation:", aiError);
    }

    // Revalidate relevant paths
    revalidatePath("/big-rocks");
    revalidatePath(`/big-rocks?month=${bigRock.month}`);
    revalidatePath(`/big-rocks/${id}`);
    revalidatePath(`/big-rocks/${id}/edit`);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error confirming Big Rock:", error);

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: "Error al confirmar el Big Rock",
    };
  }
}

/**
 * Server action to generate AI evaluation for a Big Rock.
 * Can be called by supervisors/admins when no AI evaluation exists yet.
 */
export async function generateAIEvaluation(bigRockId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const user = await requireAuth();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userRole = (user as any).role as UserRole;

    if (userRole !== "SUPERVISOR" && userRole !== "ADMIN" && userRole !== "SUPERADMIN") {
      return {
        success: false,
        error: "No tienes permiso para generar evaluaciones IA",
      };
    }

    const bigRock = await prisma.bigRock.findUnique({
      where: { id: bigRockId },
      select: { id: true, month: true },
    });

    if (!bigRock) {
      return {
        success: false,
        error: "Big Rock no encontrado",
      };
    }

    await evaluateBigRock(bigRockId);

    revalidatePath(`/big-rocks/${bigRockId}`);
    revalidatePath("/supervisor");

    return { success: true };
  } catch (error) {
    console.error("Error generating AI evaluation:", error);
    return {
      success: false,
      error: "Error al generar la evaluacion IA",
    };
  }
}
