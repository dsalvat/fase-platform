"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { getCurrentCompanyId } from "@/lib/company-context";
import { UserRole, QuarterPeriod, OKRObjectiveStatus, OKRKeyResultStatus } from "@prisma/client";

// ============================================
// QUARTER ACTIONS
// ============================================

export async function activateQuarter(data: {
  year: number;
  quarter: QuarterPeriod;
}) {
  const user = await requireAuth();
  const companyId = await getCurrentCompanyId();

  if (!companyId) {
    return { success: false, error: "No company selected" };
  }

  // Check if user is admin
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  if (dbUser?.role !== UserRole.ADMIN && dbUser?.role !== UserRole.SUPERADMIN) {
    return { success: false, error: "Not authorized" };
  }

  // Calculate start and end dates for the quarter
  const startMonth = (parseInt(data.quarter.replace("Q", "")) - 1) * 3;
  const startDate = new Date(data.year, startMonth, 1);
  const endDate = new Date(data.year, startMonth + 3, 0); // Last day of the quarter

  try {
    // Deactivate all other quarters for this company
    await prisma.oKRQuarter.updateMany({
      where: { companyId, isActive: true },
      data: { isActive: false },
    });

    // Create or update the quarter
    const quarter = await prisma.oKRQuarter.upsert({
      where: {
        year_quarter_companyId: {
          year: data.year,
          quarter: data.quarter,
          companyId,
        },
      },
      update: { isActive: true },
      create: {
        year: data.year,
        quarter: data.quarter,
        companyId,
        startDate,
        endDate,
        isActive: true,
      },
    });

    revalidatePath("/okr");
    revalidatePath("/okr/trimestres");
    return { success: true, data: quarter };
  } catch (error) {
    console.error("Error activating quarter:", error);
    return { success: false, error: "Failed to activate quarter" };
  }
}

// ============================================
// TEAM ACTIONS
// ============================================

export async function createTeam(data: {
  name: string;
  description?: string;
}) {
  const user = await requireAuth();
  const companyId = await getCurrentCompanyId();

  if (!companyId) {
    return { success: false, error: "No company selected" };
  }

  // Check if user is admin
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  if (dbUser?.role !== UserRole.ADMIN && dbUser?.role !== UserRole.SUPERADMIN) {
    return { success: false, error: "Not authorized" };
  }

  try {
    // Create team and add creator as member in a transaction
    const team = await prisma.$transaction(async (tx) => {
      const newTeam = await tx.team.create({
        data: {
          name: data.name,
          description: data.description,
          companyId,
        },
      });

      // Add creator as team member
      await tx.teamMember.create({
        data: {
          teamId: newTeam.id,
          userId: user.id,
          role: "Creador",
        },
      });

      return newTeam;
    });

    revalidatePath("/okr");
    revalidatePath("/okr/equipos");
    return { success: true, data: team };
  } catch (error) {
    console.error("Error creating team:", error);
    return { success: false, error: "Failed to create team" };
  }
}

export async function updateTeam(
  teamId: string,
  data: {
    name?: string;
    description?: string;
  }
) {
  const user = await requireAuth();

  // Check if user is admin
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  if (dbUser?.role !== UserRole.ADMIN && dbUser?.role !== UserRole.SUPERADMIN) {
    return { success: false, error: "Not authorized" };
  }

  try {
    const team = await prisma.team.update({
      where: { id: teamId },
      data,
    });

    revalidatePath("/okr");
    revalidatePath("/okr/equipos");
    revalidatePath(`/okr/equipos/${teamId}`);
    return { success: true, data: team };
  } catch (error) {
    console.error("Error updating team:", error);
    return { success: false, error: "Failed to update team" };
  }
}

export async function addTeamMember(teamId: string, userId: string, role?: string) {
  const user = await requireAuth();

  // Check if user is admin
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  if (dbUser?.role !== UserRole.ADMIN && dbUser?.role !== UserRole.SUPERADMIN) {
    return { success: false, error: "Not authorized" };
  }

  try {
    const member = await prisma.teamMember.create({
      data: {
        teamId,
        userId,
        role,
      },
    });

    revalidatePath(`/okr/equipos/${teamId}`);
    return { success: true, data: member };
  } catch (error) {
    console.error("Error adding team member:", error);
    return { success: false, error: "Failed to add team member" };
  }
}

export async function removeTeamMember(teamId: string, userId: string) {
  const user = await requireAuth();

  // Check if user is admin
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  if (dbUser?.role !== UserRole.ADMIN && dbUser?.role !== UserRole.SUPERADMIN) {
    return { success: false, error: "Not authorized" };
  }

  try {
    await prisma.teamMember.delete({
      where: {
        userId_teamId: {
          userId,
          teamId,
        },
      },
    });

    revalidatePath(`/okr/equipos/${teamId}`);
    return { success: true };
  } catch (error) {
    console.error("Error removing team member:", error);
    return { success: false, error: "Failed to remove team member" };
  }
}

// ============================================
// OBJECTIVE ACTIONS
// ============================================

export async function createObjective(data: {
  title: string;
  description?: string;
  indicator: string;
  teamId: string;
  quarterId: string;
}) {
  const user = await requireAuth();

  try {
    const objective = await prisma.oKRObjective.create({
      data: {
        title: data.title,
        description: data.description,
        indicator: data.indicator,
        teamId: data.teamId,
        quarterId: data.quarterId,
        ownerId: user.id,
        status: OKRObjectiveStatus.DRAFT,
        progress: 0,
      },
    });

    revalidatePath("/okr");
    revalidatePath("/okr/objetivos");
    return { success: true, data: objective };
  } catch (error) {
    console.error("Error creating objective:", error);
    return { success: false, error: "Failed to create objective" };
  }
}

export async function updateObjective(
  objectiveId: string,
  data: {
    title?: string;
    description?: string;
    indicator?: string;
    status?: OKRObjectiveStatus;
  }
) {
  const user = await requireAuth();

  // Check if user is owner or admin
  const objective = await prisma.oKRObjective.findUnique({
    where: { id: objectiveId },
    select: { ownerId: true },
  });

  if (!objective) {
    return { success: false, error: "Objective not found" };
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  const isAdmin = dbUser?.role === UserRole.ADMIN || dbUser?.role === UserRole.SUPERADMIN;
  const isOwner = objective.ownerId === user.id;

  if (!isAdmin && !isOwner) {
    return { success: false, error: "Not authorized" };
  }

  try {
    const updated = await prisma.oKRObjective.update({
      where: { id: objectiveId },
      data,
    });

    revalidatePath("/okr");
    revalidatePath("/okr/objetivos");
    revalidatePath(`/okr/objetivos/${objectiveId}`);
    return { success: true, data: updated };
  } catch (error) {
    console.error("Error updating objective:", error);
    return { success: false, error: "Failed to update objective" };
  }
}

export async function deleteObjective(objectiveId: string) {
  const user = await requireAuth();

  // Check if user is owner or admin
  const objective = await prisma.oKRObjective.findUnique({
    where: { id: objectiveId },
    select: { ownerId: true },
  });

  if (!objective) {
    return { success: false, error: "Objective not found" };
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  const isAdmin = dbUser?.role === UserRole.ADMIN || dbUser?.role === UserRole.SUPERADMIN;
  const isOwner = objective.ownerId === user.id;

  if (!isAdmin && !isOwner) {
    return { success: false, error: "Not authorized" };
  }

  try {
    await prisma.oKRObjective.delete({
      where: { id: objectiveId },
    });

    revalidatePath("/okr");
    revalidatePath("/okr/objetivos");
    return { success: true };
  } catch (error) {
    console.error("Error deleting objective:", error);
    return { success: false, error: "Failed to delete objective" };
  }
}

// ============================================
// KEY RESULT ACTIONS
// ============================================

export async function createKeyResult(data: {
  objectiveId: string;
  title: string;
  description?: string;
  indicator: string;
  targetValue: number;
  startValue?: number;
  unit?: string;
}) {
  const user = await requireAuth();

  try {
    const keyResult = await prisma.oKRKeyResult.create({
      data: {
        objectiveId: data.objectiveId,
        title: data.title,
        description: data.description,
        indicator: data.indicator,
        targetValue: data.targetValue,
        startValue: data.startValue || 0,
        currentValue: data.startValue || 0,
        unit: data.unit || "%",
        responsibleId: user.id,
        status: OKRKeyResultStatus.NOT_STARTED,
      },
    });

    // Update objective progress
    await updateObjectiveProgress(data.objectiveId);

    revalidatePath(`/okr/objetivos/${data.objectiveId}`);
    return { success: true, data: keyResult };
  } catch (error) {
    console.error("Error creating key result:", error);
    return { success: false, error: "Failed to create key result" };
  }
}

export async function updateKeyResult(
  keyResultId: string,
  data: {
    title?: string;
    description?: string;
    indicator?: string;
    targetValue?: number;
    currentValue?: number;
    unit?: string;
    status?: OKRKeyResultStatus;
  }
) {
  const user = await requireAuth();

  // Get the key result to check ownership and get objectiveId
  const keyResult = await prisma.oKRKeyResult.findUnique({
    where: { id: keyResultId },
    select: { responsibleId: true, objectiveId: true },
  });

  if (!keyResult) {
    return { success: false, error: "Key result not found" };
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  const isAdmin = dbUser?.role === UserRole.ADMIN || dbUser?.role === UserRole.SUPERADMIN;
  const isResponsible = keyResult.responsibleId === user.id;

  if (!isAdmin && !isResponsible) {
    return { success: false, error: "Not authorized" };
  }

  try {
    const updated = await prisma.oKRKeyResult.update({
      where: { id: keyResultId },
      data,
    });

    // Update objective progress
    await updateObjectiveProgress(keyResult.objectiveId);

    revalidatePath(`/okr/objetivos/${keyResult.objectiveId}`);
    return { success: true, data: updated };
  } catch (error) {
    console.error("Error updating key result:", error);
    return { success: false, error: "Failed to update key result" };
  }
}

export async function deleteKeyResult(keyResultId: string) {
  const user = await requireAuth();

  // Get the key result to check ownership
  const keyResult = await prisma.oKRKeyResult.findUnique({
    where: { id: keyResultId },
    select: { responsibleId: true, objectiveId: true },
  });

  if (!keyResult) {
    return { success: false, error: "Key result not found" };
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  const isAdmin = dbUser?.role === UserRole.ADMIN || dbUser?.role === UserRole.SUPERADMIN;
  const isResponsible = keyResult.responsibleId === user.id;

  if (!isAdmin && !isResponsible) {
    return { success: false, error: "Not authorized" };
  }

  try {
    await prisma.oKRKeyResult.delete({
      where: { id: keyResultId },
    });

    // Update objective progress
    await updateObjectiveProgress(keyResult.objectiveId);

    revalidatePath(`/okr/objetivos/${keyResult.objectiveId}`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting key result:", error);
    return { success: false, error: "Failed to delete key result" };
  }
}

// Helper function to update objective progress based on key results
async function updateObjectiveProgress(objectiveId: string) {
  const keyResults = await prisma.oKRKeyResult.findMany({
    where: { objectiveId },
    select: { currentValue: true, targetValue: true, startValue: true },
  });

  if (keyResults.length === 0) {
    await prisma.oKRObjective.update({
      where: { id: objectiveId },
      data: { progress: 0 },
    });
    return;
  }

  // Calculate average progress across all key results
  const totalProgress = keyResults.reduce((sum, kr) => {
    const range = kr.targetValue - kr.startValue;
    if (range === 0) return sum + 100;
    const progress = ((kr.currentValue - kr.startValue) / range) * 100;
    return sum + Math.min(100, Math.max(0, progress));
  }, 0);

  const avgProgress = totalProgress / keyResults.length;

  await prisma.oKRObjective.update({
    where: { id: objectiveId },
    data: { progress: avgProgress },
  });
}

// ============================================
// KEY ACTIVITY ACTIONS
// ============================================

export async function createKeyActivity(data: {
  keyResultId: string;
  title: string;
  description?: string;
  dueDate?: Date;
  assigneeId?: string;
}) {
  await requireAuth();

  try {
    const activity = await prisma.oKRKeyActivity.create({
      data: {
        keyResultId: data.keyResultId,
        title: data.title,
        description: data.description,
        dueDate: data.dueDate,
        assigneeId: data.assigneeId,
      },
    });

    // Get objectiveId for revalidation
    const keyResult = await prisma.oKRKeyResult.findUnique({
      where: { id: data.keyResultId },
      select: { objectiveId: true },
    });

    if (keyResult) {
      revalidatePath(`/okr/objetivos/${keyResult.objectiveId}`);
    }

    return { success: true, data: activity };
  } catch (error) {
    console.error("Error creating key activity:", error);
    return { success: false, error: "Failed to create key activity" };
  }
}

export async function toggleKeyActivityComplete(activityId: string) {
  await requireAuth();

  try {
    const activity = await prisma.oKRKeyActivity.findUnique({
      where: { id: activityId },
      select: { completed: true, keyResultId: true },
    });

    if (!activity) {
      return { success: false, error: "Activity not found" };
    }

    const updated = await prisma.oKRKeyActivity.update({
      where: { id: activityId },
      data: {
        completed: !activity.completed,
        completedAt: !activity.completed ? new Date() : null,
      },
    });

    // Get objectiveId for revalidation
    const keyResult = await prisma.oKRKeyResult.findUnique({
      where: { id: activity.keyResultId },
      select: { objectiveId: true },
    });

    if (keyResult) {
      revalidatePath(`/okr/objetivos/${keyResult.objectiveId}`);
    }

    return { success: true, data: updated };
  } catch (error) {
    console.error("Error toggling activity:", error);
    return { success: false, error: "Failed to toggle activity" };
  }
}

export async function deleteKeyActivity(activityId: string) {
  await requireAuth();

  try {
    const activity = await prisma.oKRKeyActivity.findUnique({
      where: { id: activityId },
      select: { keyResultId: true },
    });

    if (!activity) {
      return { success: false, error: "Activity not found" };
    }

    await prisma.oKRKeyActivity.delete({
      where: { id: activityId },
    });

    // Get objectiveId for revalidation
    const keyResult = await prisma.oKRKeyResult.findUnique({
      where: { id: activity.keyResultId },
      select: { objectiveId: true },
    });

    if (keyResult) {
      revalidatePath(`/okr/objetivos/${keyResult.objectiveId}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting activity:", error);
    return { success: false, error: "Failed to delete activity" };
  }
}
