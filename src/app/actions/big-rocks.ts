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
import { inlineKeyPersonSchema } from "@/lib/validations/key-person";
import { BigRockStatus } from "@prisma/client";
import { recordBigRockCreated } from "@/lib/gamification";
import {
  logBigRockCreated,
  logBigRockUpdated,
  logBigRockDeleted,
  logKeyPersonCreated,
  logKeyMeetingCreated,
} from "@/lib/activity-log";
import { InlineKeyPerson, InlineKeyMeeting } from "@/types/inline-forms";
import { z } from "zod";

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
    const rawData = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
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

    // Extract key people and meetings data
    let keyPeopleIds: string[] = [];
    let newKeyPeople: InlineKeyPerson[] = [];
    let keyMeetings: InlineKeyMeeting[] = [];

    try {
      const keyPeopleIdsStr = formData.get("keyPeopleIds") as string;
      if (keyPeopleIdsStr) {
        keyPeopleIds = JSON.parse(keyPeopleIdsStr);
      }
    } catch {
      // Ignore parsing errors
    }

    try {
      const newKeyPeopleStr = formData.get("newKeyPeople") as string;
      if (newKeyPeopleStr) {
        const parsed = JSON.parse(newKeyPeopleStr);
        // Validate each new key person
        newKeyPeople = parsed.map((p: unknown) => inlineKeyPersonSchema.parse(p));
      }
    } catch (e) {
      if (e instanceof z.ZodError) {
        return {
          success: false,
          error: `Error en datos de persona clave: ${e.errors[0]?.message}`,
        };
      }
    }

    try {
      const keyMeetingsStr = formData.get("keyMeetings") as string;
      if (keyMeetingsStr) {
        keyMeetings = JSON.parse(keyMeetingsStr);
      }
    } catch {
      // Ignore parsing errors
    }

    // Verify that all existing keyPeopleIds belong to the user
    if (keyPeopleIds.length > 0) {
      const existingPeople = await prisma.keyPerson.findMany({
        where: {
          id: { in: keyPeopleIds },
          userId: user.id,
        },
        select: { id: true },
      });
      const validIds = new Set(existingPeople.map(p => p.id));
      keyPeopleIds = keyPeopleIds.filter(id => validIds.has(id));
    }

    // Create BigRock with relations in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create new KeyPersons
      const createdKeyPeopleIds: string[] = [];
      for (const person of newKeyPeople) {
        const newPerson = await tx.keyPerson.create({
          data: {
            firstName: person.firstName,
            lastName: person.lastName,
            role: person.role || null,
            contact: person.contact || null,
            userId: user.id,
            companyId: companyId,
          },
        });
        createdKeyPeopleIds.push(newPerson.id);

        // Log key person creation
        try {
          await logKeyPersonCreated(user.id, newPerson.id, `${newPerson.firstName} ${newPerson.lastName}`);
        } catch (logError) {
          console.error("Error recording activity log:", logError);
        }
      }

      // 2. Create BigRock with keyPeople connected
      const allKeyPeopleIds = [...keyPeopleIds, ...createdKeyPeopleIds];
      const bigRock = await tx.bigRock.create({
        data: {
          ...validated,
          userId: user.id,
          companyId: companyId,
          keyPeople: allKeyPeopleIds.length > 0
            ? { connect: allKeyPeopleIds.map(id => ({ id })) }
            : undefined,
        },
      });

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
    revalidatePath("/key-people");

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
    const rawData = {
      id,
      title: formData.get("title") as string | undefined,
      description: formData.get("description") as string | undefined,
      indicator: formData.get("indicator") as string | undefined,
      numTars: formData.get("numTars") ? Number(formData.get("numTars")) : undefined,
      status: formData.get("status") as BigRockStatus | undefined,
    };

    // Validate with Zod
    const validated = updateBigRockSchema.parse(rawData);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _, ...updateData } = validated;

    // Extract key people and meetings data
    let keyPeopleIds: string[] | null = null;
    let newKeyPeople: InlineKeyPerson[] = [];
    let keyMeetings: InlineKeyMeeting[] | null = null;

    // Check if keyPeopleIds field is present (indicates we should update keyPeople)
    if (formData.has("keyPeopleIds")) {
      try {
        const keyPeopleIdsStr = formData.get("keyPeopleIds") as string;
        keyPeopleIds = keyPeopleIdsStr ? JSON.parse(keyPeopleIdsStr) : [];
      } catch {
        keyPeopleIds = [];
      }
    }

    try {
      const newKeyPeopleStr = formData.get("newKeyPeople") as string;
      if (newKeyPeopleStr) {
        const parsed = JSON.parse(newKeyPeopleStr);
        newKeyPeople = parsed.map((p: unknown) => inlineKeyPersonSchema.parse(p));
      }
    } catch (e) {
      if (e instanceof z.ZodError) {
        return {
          success: false,
          error: `Error en datos de persona clave: ${e.errors[0]?.message}`,
        };
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

    // Verify that all existing keyPeopleIds belong to the user
    if (keyPeopleIds !== null && keyPeopleIds.length > 0) {
      // Validate keyPeopleIds belong to the company
      const existingPeople = await prisma.keyPerson.findMany({
        where: {
          id: { in: keyPeopleIds },
          companyId: companyId,
        },
        select: { id: true },
      });
      const validIds = new Set(existingPeople.map(p => p.id));
      keyPeopleIds = keyPeopleIds.filter(id => validIds.has(id));
    }

    // Update BigRock with relations in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create new KeyPersons
      const createdKeyPeopleIds: string[] = [];
      for (const person of newKeyPeople) {
        const newPerson = await tx.keyPerson.create({
          data: {
            firstName: person.firstName,
            lastName: person.lastName,
            role: person.role || null,
            contact: person.contact || null,
            userId: user.id,
            companyId: companyId,
          },
        });
        createdKeyPeopleIds.push(newPerson.id);

        // Log key person creation
        try {
          await logKeyPersonCreated(user.id, newPerson.id, `${newPerson.firstName} ${newPerson.lastName}`);
        } catch (logError) {
          console.error("Error recording activity log:", logError);
        }
      }

      // 2. Update BigRock with keyPeople if specified
      const allKeyPeopleIds = keyPeopleIds !== null
        ? [...keyPeopleIds, ...createdKeyPeopleIds]
        : createdKeyPeopleIds.length > 0
          ? createdKeyPeopleIds
          : null;

      const bigRock = await tx.bigRock.update({
        where: { id },
        data: {
          ...updateData,
          // Only update keyPeople if we have IDs to set
          ...(allKeyPeopleIds !== null && {
            keyPeople: {
              set: allKeyPeopleIds.map(pid => ({ id: pid })),
            },
          }),
        },
      });

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
    revalidatePath("/key-people");

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

/**
 * Server action to confirm a Big Rock
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
        isConfirmed: true,
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

    if (bigRock.isConfirmed) {
      return {
        success: false,
        error: "Este Big Rock ya está confirmado",
      };
    }

    // Validate that all required fields are filled
    if (!bigRock.title || !bigRock.description || !bigRock.indicator) {
      return {
        success: false,
        error: "Completa todos los campos requeridos antes de confirmar",
      };
    }

    // Confirm the Big Rock
    await prisma.bigRock.update({
      where: { id },
      data: { isConfirmed: true },
    });

    // Record activity log
    try {
      await logBigRockUpdated(user.id, id, bigRock.title, { isConfirmed: true });
    } catch (logError) {
      console.error("Error recording activity log:", logError);
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
