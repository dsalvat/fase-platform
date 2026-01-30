"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAuth, canModifyKeyPerson, canModifyBigRock } from "@/lib/auth";
import { getCurrentCompanyId } from "@/lib/company-context";
import {
  createKeyPersonSchema,
  updateKeyPersonSchema,
} from "@/lib/validations/key-person";
import {
  logKeyPersonCreated,
  logKeyPersonUpdated,
  logKeyPersonDeleted,
} from "@/lib/activity-log";

/**
 * Server action to create a new Key Person
 * @param formData - Form data from the create form
 * @returns Success response with the created Key Person ID
 */
export async function createKeyPerson(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prevState: any,
  formData: FormData
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const user = await requireAuth();
    const companyId = await getCurrentCompanyId();

    // Extract form data
    const rawData = {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      role: formData.get("role") as string | null,
      contact: formData.get("contact") as string | null,
    };

    // Validate with Zod
    const validated = createKeyPersonSchema.parse(rawData);

    // Create Key Person in database (associated with the current company)
    const keyPerson = await prisma.keyPerson.create({
      data: {
        firstName: validated.firstName,
        lastName: validated.lastName,
        role: validated.role || null,
        contact: validated.contact || null,
        userId: user.id,
        companyId: companyId,
      },
    });

    // Record activity log
    try {
      const fullName = `${keyPerson.firstName} ${keyPerson.lastName}`;
      await logKeyPersonCreated(user.id, keyPerson.id, fullName);
    } catch (logError) {
      console.error("Error recording activity log:", logError);
    }

    // Revalidate relevant paths
    revalidatePath("/key-people");

    return {
      success: true,
      id: keyPerson.id,
    };
  } catch (error) {
    console.error("Error creating Key Person:", error);

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: "Error al crear la persona clave",
    };
  }
}

/**
 * Server action to update an existing Key Person
 * @param id - ID of the Key Person to update
 * @param formData - Form data from the edit form
 * @returns Success response
 */
export async function updateKeyPerson(
  id: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prevState: any,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireAuth();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userRole = (user as any).role;

    // Check if user can modify this Key Person
    const canModify = await canModifyKeyPerson(id, user.id, userRole);
    if (!canModify) {
      return {
        success: false,
        error: "No tienes permiso para editar esta persona clave",
      };
    }

    // Extract form data
    const rawData = {
      id,
      firstName: formData.get("firstName") as string | undefined,
      lastName: formData.get("lastName") as string | undefined,
      role: formData.get("role") as string | null,
      contact: formData.get("contact") as string | null,
    };

    // Validate with Zod
    const validated = updateKeyPersonSchema.parse(rawData);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _, ...updateData } = validated;

    // Build update object
    const dataToUpdate: Record<string, unknown> = {};
    if (updateData.firstName !== undefined) dataToUpdate.firstName = updateData.firstName;
    if (updateData.lastName !== undefined) dataToUpdate.lastName = updateData.lastName;
    if (updateData.role !== undefined) dataToUpdate.role = updateData.role;
    if (updateData.contact !== undefined) dataToUpdate.contact = updateData.contact;

    // Update Key Person in database
    const keyPerson = await prisma.keyPerson.update({
      where: { id },
      data: dataToUpdate,
    });

    // Record activity log
    try {
      const fullName = `${keyPerson.firstName} ${keyPerson.lastName}`;
      await logKeyPersonUpdated(keyPerson.userId, keyPerson.id, fullName, dataToUpdate);
    } catch (logError) {
      console.error("Error recording activity log:", logError);
    }

    // Revalidate relevant paths
    revalidatePath("/key-people");
    revalidatePath(`/key-people/${id}`);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error updating Key Person:", error);

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: "Error al actualizar la persona clave",
    };
  }
}

/**
 * Server action to delete a Key Person
 * @param id - ID of the Key Person to delete
 * @returns Success response
 */
export async function deleteKeyPerson(id: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const user = await requireAuth();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userRole = (user as any).role;

    // Check if user can modify this Key Person
    const canModify = await canModifyKeyPerson(id, user.id, userRole);
    if (!canModify) {
      return {
        success: false,
        error: "No tienes permiso para eliminar esta persona clave",
      };
    }

    // Get Key Person data before deleting
    const keyPerson = await prisma.keyPerson.findUnique({
      where: { id },
      select: { firstName: true, lastName: true, userId: true },
    });

    if (!keyPerson) {
      return {
        success: false,
        error: "Persona clave no encontrada",
      };
    }

    const fullName = `${keyPerson.firstName} ${keyPerson.lastName}`;
    const ownerId = keyPerson.userId;

    // Delete Key Person (cascade will handle TAR relations)
    await prisma.keyPerson.delete({
      where: { id },
    });

    // Record activity log
    try {
      await logKeyPersonDeleted(ownerId, id, fullName);
    } catch (logError) {
      console.error("Error recording activity log:", logError);
    }

    // Revalidate relevant paths
    revalidatePath("/key-people");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error deleting Key Person:", error);

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: "Error al eliminar la persona clave",
    };
  }
}

/**
 * Server action to link a Key Person to a BigRock
 * @param keyPersonId - ID of the Key Person
 * @param bigRockId - ID of the BigRock
 * @returns Success response
 */
export async function linkKeyPersonToBigRock(
  keyPersonId: string,
  bigRockId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireAuth();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userRole = (user as any).role;

    // Check modification permissions for Key Person
    const canModifyPerson = await canModifyKeyPerson(keyPersonId, user.id, userRole);
    if (!canModifyPerson) {
      return {
        success: false,
        error: "No tienes permiso para modificar esta persona clave",
      };
    }

    // Check modification permissions for BigRock
    const canModifyRock = await canModifyBigRock(bigRockId, user.id, userRole);
    if (!canModifyRock) {
      return {
        success: false,
        error: "No tienes permiso para modificar este Big Rock o el mes es de solo lectura",
      };
    }

    // Verify BigRock belongs to same user as KeyPerson
    const [keyPerson, bigRock] = await Promise.all([
      prisma.keyPerson.findUnique({
        where: { id: keyPersonId },
        select: { userId: true },
      }),
      prisma.bigRock.findUnique({
        where: { id: bigRockId },
        select: { userId: true },
      }),
    ]);

    if (!keyPerson || !bigRock) {
      return {
        success: false,
        error: "Persona clave o Big Rock no encontrado",
      };
    }

    if (keyPerson.userId !== bigRock.userId) {
      return {
        success: false,
        error: "La persona clave y el Big Rock deben pertenecer al mismo usuario",
      };
    }

    // Link Key Person to BigRock
    await prisma.bigRock.update({
      where: { id: bigRockId },
      data: {
        keyPeople: {
          connect: { id: keyPersonId },
        },
      },
    });

    // Revalidate relevant paths
    revalidatePath("/key-people");
    revalidatePath(`/key-people/${keyPersonId}`);
    revalidatePath(`/big-rocks/${bigRockId}`);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error linking Key Person to BigRock:", error);

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: "Error al vincular la persona clave al Big Rock",
    };
  }
}

/**
 * Server action to unlink a Key Person from a BigRock
 * @param keyPersonId - ID of the Key Person
 * @param bigRockId - ID of the BigRock
 * @returns Success response
 */
export async function unlinkKeyPersonFromBigRock(
  keyPersonId: string,
  bigRockId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireAuth();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userRole = (user as any).role;

    // Check modification permissions for BigRock
    const canModifyRock = await canModifyBigRock(bigRockId, user.id, userRole);
    if (!canModifyRock) {
      return {
        success: false,
        error: "No tienes permiso para modificar este Big Rock o el mes es de solo lectura",
      };
    }

    // Unlink Key Person from BigRock
    await prisma.bigRock.update({
      where: { id: bigRockId },
      data: {
        keyPeople: {
          disconnect: { id: keyPersonId },
        },
      },
    });

    // Revalidate relevant paths
    revalidatePath("/key-people");
    revalidatePath(`/key-people/${keyPersonId}`);
    revalidatePath(`/big-rocks/${bigRockId}`);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error unlinking Key Person from BigRock:", error);

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: "Error al desvincular la persona clave del Big Rock",
    };
  }
}
