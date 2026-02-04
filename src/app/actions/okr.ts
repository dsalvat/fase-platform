"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { getCurrentCompanyId } from "@/lib/company-context";
import { UserRole, QuarterPeriod, OKRObjectiveStatus, OKRKeyResultStatus, TeamMemberRole } from "@prisma/client";

// ============================================
// PERMISSION HELPERS
// ============================================

// Get user's role in a specific team
async function getTeamMemberRole(userId: string, teamId: string): Promise<TeamMemberRole | null> {
  const member = await prisma.teamMember.findUnique({
    where: {
      userId_teamId: {
        userId,
        teamId,
      },
    },
    select: { role: true },
  });
  return member?.role ?? null;
}

// Check if user can create objectives (RESPONSABLE only)
function canCreateObjectives(role: TeamMemberRole | null): boolean {
  return role === TeamMemberRole.RESPONSABLE;
}

// Check if user can edit objectives (RESPONSABLE or EDITOR)
function canEditObjectives(role: TeamMemberRole | null): boolean {
  return role === TeamMemberRole.RESPONSABLE || role === TeamMemberRole.EDITOR;
}

// Check if user can view objectives (all roles)
function canViewObjectives(role: TeamMemberRole | null): boolean {
  return role !== null;
}

// Check if user can manage team members (RESPONSABLE only)
function canManageTeamMembers(role: TeamMemberRole | null): boolean {
  return role === TeamMemberRole.RESPONSABLE;
}

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

      // Add creator as RESPONSABLE (team leader)
      await tx.teamMember.create({
        data: {
          teamId: newTeam.id,
          userId: user.id,
          role: TeamMemberRole.RESPONSABLE,
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

export async function addTeamMember(teamId: string, userId: string, role: TeamMemberRole = TeamMemberRole.VISUALIZADOR) {
  const user = await requireAuth();

  // Check if user is admin or RESPONSABLE of the team
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  const isAdmin = dbUser?.role === UserRole.ADMIN || dbUser?.role === UserRole.SUPERADMIN;
  const userTeamRole = await getTeamMemberRole(user.id, teamId);

  if (!isAdmin && !canManageTeamMembers(userTeamRole)) {
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

  // Check if user is admin or RESPONSABLE of the team
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  const isAdmin = dbUser?.role === UserRole.ADMIN || dbUser?.role === UserRole.SUPERADMIN;
  const userTeamRole = await getTeamMemberRole(user.id, teamId);

  if (!isAdmin && !canManageTeamMembers(userTeamRole)) {
    return { success: false, error: "Not authorized" };
  }

  // Prevent removing the last RESPONSABLE
  const memberToRemove = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId, teamId } },
    select: { role: true },
  });

  if (memberToRemove?.role === TeamMemberRole.RESPONSABLE) {
    const responsableCount = await prisma.teamMember.count({
      where: { teamId, role: TeamMemberRole.RESPONSABLE },
    });

    if (responsableCount <= 1) {
      return { success: false, error: "Cannot remove the last RESPONSABLE from the team" };
    }
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

export async function updateTeamMemberRole(teamId: string, userId: string, newRole: TeamMemberRole) {
  const user = await requireAuth();

  // Check if user is admin or RESPONSABLE of the team
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  const isAdmin = dbUser?.role === UserRole.ADMIN || dbUser?.role === UserRole.SUPERADMIN;
  const userTeamRole = await getTeamMemberRole(user.id, teamId);

  if (!isAdmin && !canManageTeamMembers(userTeamRole)) {
    return { success: false, error: "Not authorized" };
  }

  // Prevent changing the last RESPONSABLE to another role
  const currentMember = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId, teamId } },
    select: { role: true },
  });

  if (currentMember?.role === TeamMemberRole.RESPONSABLE && newRole !== TeamMemberRole.RESPONSABLE) {
    const responsableCount = await prisma.teamMember.count({
      where: { teamId, role: TeamMemberRole.RESPONSABLE },
    });

    if (responsableCount <= 1) {
      return { success: false, error: "Cannot change the role of the last RESPONSABLE" };
    }
  }

  try {
    const member = await prisma.teamMember.update({
      where: { userId_teamId: { userId, teamId } },
      data: { role: newRole },
    });

    revalidatePath(`/okr/equipos/${teamId}`);
    return { success: true, data: member };
  } catch (error) {
    console.error("Error updating team member role:", error);
    return { success: false, error: "Failed to update team member role" };
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

  // Check if user is admin or RESPONSABLE of the team
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  const isAdmin = dbUser?.role === UserRole.ADMIN || dbUser?.role === UserRole.SUPERADMIN;
  const userTeamRole = await getTeamMemberRole(user.id, data.teamId);

  if (!isAdmin && !canCreateObjectives(userTeamRole)) {
    return { success: false, error: "Not authorized. Only RESPONSABLE can create objectives." };
  }

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

  // Get objective with team info
  const objective = await prisma.oKRObjective.findUnique({
    where: { id: objectiveId },
    select: { ownerId: true, teamId: true },
  });

  if (!objective) {
    return { success: false, error: "Objective not found" };
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  const isAdmin = dbUser?.role === UserRole.ADMIN || dbUser?.role === UserRole.SUPERADMIN;
  const userTeamRole = await getTeamMemberRole(user.id, objective.teamId);

  // RESPONSABLE and EDITOR can edit objectives
  if (!isAdmin && !canEditObjectives(userTeamRole)) {
    return { success: false, error: "Not authorized. Only RESPONSABLE or EDITOR can edit objectives." };
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

  // Get objective with team info
  const objective = await prisma.oKRObjective.findUnique({
    where: { id: objectiveId },
    select: { ownerId: true, teamId: true },
  });

  if (!objective) {
    return { success: false, error: "Objective not found" };
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  const isAdmin = dbUser?.role === UserRole.ADMIN || dbUser?.role === UserRole.SUPERADMIN;
  const userTeamRole = await getTeamMemberRole(user.id, objective.teamId);

  // Only RESPONSABLE can delete objectives
  if (!isAdmin && !canCreateObjectives(userTeamRole)) {
    return { success: false, error: "Not authorized. Only RESPONSABLE can delete objectives." };
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
  responsibleId?: string;
}) {
  const user = await requireAuth();

  // Get the objective to check team membership
  const objective = await prisma.oKRObjective.findUnique({
    where: { id: data.objectiveId },
    select: { teamId: true },
  });

  if (!objective) {
    return { success: false, error: "Objective not found" };
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  const isAdmin = dbUser?.role === UserRole.ADMIN || dbUser?.role === UserRole.SUPERADMIN;
  const userTeamRole = await getTeamMemberRole(user.id, objective.teamId);

  // RESPONSABLE and EDITOR can create key results
  if (!isAdmin && !canEditObjectives(userTeamRole)) {
    return { success: false, error: "Not authorized. Only RESPONSABLE or EDITOR can create key results." };
  }

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
        responsibleId: data.responsibleId || user.id,
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

  // Get the key result with objective and team info
  const keyResult = await prisma.oKRKeyResult.findUnique({
    where: { id: keyResultId },
    select: {
      responsibleId: true,
      objectiveId: true,
      objective: { select: { teamId: true } },
    },
  });

  if (!keyResult) {
    return { success: false, error: "Key result not found" };
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  const isAdmin = dbUser?.role === UserRole.ADMIN || dbUser?.role === UserRole.SUPERADMIN;
  const userTeamRole = await getTeamMemberRole(user.id, keyResult.objective.teamId);

  // RESPONSABLE and EDITOR can update key results
  if (!isAdmin && !canEditObjectives(userTeamRole)) {
    return { success: false, error: "Not authorized. Only RESPONSABLE or EDITOR can update key results." };
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

  // Get the key result with objective and team info
  const keyResult = await prisma.oKRKeyResult.findUnique({
    where: { id: keyResultId },
    select: {
      responsibleId: true,
      objectiveId: true,
      objective: { select: { teamId: true } },
    },
  });

  if (!keyResult) {
    return { success: false, error: "Key result not found" };
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  const isAdmin = dbUser?.role === UserRole.ADMIN || dbUser?.role === UserRole.SUPERADMIN;
  const userTeamRole = await getTeamMemberRole(user.id, keyResult.objective.teamId);

  // Only RESPONSABLE can delete key results
  if (!isAdmin && !canCreateObjectives(userTeamRole)) {
    return { success: false, error: "Not authorized. Only RESPONSABLE can delete key results." };
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
  const user = await requireAuth();

  // Get key result with objective and team info
  const keyResult = await prisma.oKRKeyResult.findUnique({
    where: { id: data.keyResultId },
    select: {
      objectiveId: true,
      objective: { select: { teamId: true } },
    },
  });

  if (!keyResult) {
    return { success: false, error: "Key result not found" };
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  const isAdmin = dbUser?.role === UserRole.ADMIN || dbUser?.role === UserRole.SUPERADMIN;
  const userTeamRole = await getTeamMemberRole(user.id, keyResult.objective.teamId);

  // RESPONSABLE and EDITOR can create activities
  if (!isAdmin && !canEditObjectives(userTeamRole)) {
    return { success: false, error: "Not authorized. Only RESPONSABLE or EDITOR can create activities." };
  }

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

    revalidatePath(`/okr/objetivos/${keyResult.objectiveId}`);

    return { success: true, data: activity };
  } catch (error) {
    console.error("Error creating key activity:", error);
    return { success: false, error: "Failed to create key activity" };
  }
}

export async function toggleKeyActivityComplete(activityId: string) {
  const user = await requireAuth();

  // Get activity with key result, objective and team info
  const activity = await prisma.oKRKeyActivity.findUnique({
    where: { id: activityId },
    select: {
      completed: true,
      keyResultId: true,
      keyResult: {
        select: {
          objectiveId: true,
          objective: { select: { teamId: true } },
        },
      },
    },
  });

  if (!activity) {
    return { success: false, error: "Activity not found" };
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  const isAdmin = dbUser?.role === UserRole.ADMIN || dbUser?.role === UserRole.SUPERADMIN;
  const userTeamRole = await getTeamMemberRole(user.id, activity.keyResult.objective.teamId);

  // RESPONSABLE and EDITOR can toggle activities
  if (!isAdmin && !canEditObjectives(userTeamRole)) {
    return { success: false, error: "Not authorized. Only RESPONSABLE or EDITOR can update activities." };
  }

  try {
    const updated = await prisma.oKRKeyActivity.update({
      where: { id: activityId },
      data: {
        completed: !activity.completed,
        completedAt: !activity.completed ? new Date() : null,
      },
    });

    revalidatePath(`/okr/objetivos/${activity.keyResult.objectiveId}`);

    return { success: true, data: updated };
  } catch (error) {
    console.error("Error toggling activity:", error);
    return { success: false, error: "Failed to toggle activity" };
  }
}

export async function deleteKeyActivity(activityId: string) {
  const user = await requireAuth();

  // Get activity with key result, objective and team info
  const activity = await prisma.oKRKeyActivity.findUnique({
    where: { id: activityId },
    select: {
      keyResultId: true,
      keyResult: {
        select: {
          objectiveId: true,
          objective: { select: { teamId: true } },
        },
      },
    },
  });

  if (!activity) {
    return { success: false, error: "Activity not found" };
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  const isAdmin = dbUser?.role === UserRole.ADMIN || dbUser?.role === UserRole.SUPERADMIN;
  const userTeamRole = await getTeamMemberRole(user.id, activity.keyResult.objective.teamId);

  // Only RESPONSABLE can delete activities
  if (!isAdmin && !canCreateObjectives(userTeamRole)) {
    return { success: false, error: "Not authorized. Only RESPONSABLE can delete activities." };
  }

  try {
    await prisma.oKRKeyActivity.delete({
      where: { id: activityId },
    });

    revalidatePath(`/okr/objetivos/${activity.keyResult.objectiveId}`);

    return { success: true };
  } catch (error) {
    console.error("Error deleting activity:", error);
    return { success: false, error: "Failed to delete activity" };
  }
}

// ============================================
// PERMISSION QUERY ACTIONS
// ============================================

// Get user's permissions for a team (for UI)
export async function getUserTeamPermissions(teamId: string) {
  const user = await requireAuth();

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  const isAdmin = dbUser?.role === UserRole.ADMIN || dbUser?.role === UserRole.SUPERADMIN;
  const userTeamRole = await getTeamMemberRole(user.id, teamId);

  return {
    isAdmin,
    role: userTeamRole,
    canCreateObjectives: isAdmin || canCreateObjectives(userTeamRole),
    canEditObjectives: isAdmin || canEditObjectives(userTeamRole),
    canViewObjectives: isAdmin || canViewObjectives(userTeamRole),
    canManageTeamMembers: isAdmin || canManageTeamMembers(userTeamRole),
  };
}

// Get user's permissions for an objective (for UI)
export async function getUserObjectivePermissions(objectiveId: string) {
  const user = await requireAuth();

  const objective = await prisma.oKRObjective.findUnique({
    where: { id: objectiveId },
    select: { teamId: true },
  });

  if (!objective) {
    return {
      isAdmin: false,
      role: null,
      canCreateObjectives: false,
      canEditObjectives: false,
      canViewObjectives: false,
      canManageTeamMembers: false,
    };
  }

  return getUserTeamPermissions(objective.teamId);
}
