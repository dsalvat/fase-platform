"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAuth, canViewSuperviseePlanning } from "@/lib/auth";
import { getCurrentCompanyId } from "@/lib/company-context";
import { UserRole } from "@prisma/client";
import type {
  MonthPlanningStatus,
  SuperviseeWithStatus,
  SuperviseePlanningData,
} from "@/types/feedback";

/**
 * Get the planning status for a specific month
 * Shows how many Big Rocks are confirmed and if planning is confirmed
 */
export async function getMonthPlanningStatus(
  month: string
): Promise<MonthPlanningStatus> {
  const user = await requireAuth();

  // Get all Big Rocks for this month (all user's Big Rocks, regardless of company)
  const bigRocks = await prisma.bigRock.findMany({
    where: {
      userId: user.id,
      month: month,
    },
    select: {
      id: true,
      status: true,
    },
  });

  // Get the OpenMonth record if exists
  const openMonth = await prisma.openMonth.findFirst({
    where: {
      userId: user.id,
      month: month,
    },
    select: {
      isPlanningConfirmed: true,
      planningConfirmedAt: true,
    },
  });

  const totalBigRocks = bigRocks.length;
  // A Big Rock is "confirmed" if status is not CREADO
  const confirmedBigRocks = bigRocks.filter((br) => br.status !== "CREADO").length;
  const allConfirmed = totalBigRocks > 0 && confirmedBigRocks === totalBigRocks;

  return {
    month,
    totalBigRocks,
    confirmedBigRocks,
    isPlanningConfirmed: openMonth?.isPlanningConfirmed ?? false,
    planningConfirmedAt: openMonth?.planningConfirmedAt ?? null,
    canConfirmPlanning: allConfirmed && !(openMonth?.isPlanningConfirmed),
  };
}

/**
 * Confirm the month planning
 * Requires all Big Rocks to be confirmed first
 */
export async function confirmMonthPlanning(
  month: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireAuth();
    const companyId = await getCurrentCompanyId();

    // Get all Big Rocks for this month
    const bigRocks = await prisma.bigRock.findMany({
      where: {
        userId: user.id,
        month: month,
        ...(companyId && { companyId }),
      },
      select: {
        id: true,
        status: true,
      },
    });

    // Check that there are Big Rocks
    if (bigRocks.length === 0) {
      return {
        success: false,
        error: "No hay Big Rocks para este mes",
      };
    }

    // Check that all Big Rocks are confirmed (status !== CREADO)
    const allConfirmed = bigRocks.every((br) => br.status !== "CREADO");
    if (!allConfirmed) {
      return {
        success: false,
        error: "Todos los Big Rocks deben estar confirmados antes de confirmar la planificacion del mes",
      };
    }

    // Upsert the OpenMonth record with confirmation
    await prisma.openMonth.upsert({
      where: {
        month_userId: {
          month: month,
          userId: user.id,
        },
      },
      update: {
        isPlanningConfirmed: true,
        planningConfirmedAt: new Date(),
      },
      create: {
        month: month,
        userId: user.id,
        isPlanningConfirmed: true,
        planningConfirmedAt: new Date(),
      },
    });

    revalidatePath("/big-rocks");
    revalidatePath(`/big-rocks?month=${month}`);

    return { success: true };
  } catch (error) {
    console.error("Error confirming month planning:", error);
    return {
      success: false,
      error: "Error al confirmar la planificacion del mes",
    };
  }
}

/**
 * Unconfirm the month planning
 * Only ADMIN and SUPERADMIN can do this
 * Can be used on any user's planning (including own)
 */
export async function unconfirmMonthPlanning(
  month: string,
  targetUserId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireAuth();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userRole = (user as any).role as UserRole;

    // Only ADMIN and SUPERADMIN can unconfirm
    if (userRole !== "ADMIN" && userRole !== "SUPERADMIN") {
      return {
        success: false,
        error: "No tienes permiso para desconfirmar la planificacion",
      };
    }

    // Use targetUserId if provided, otherwise use current user's id
    const userId = targetUserId || user.id;

    // Update the OpenMonth record to remove confirmation
    const openMonth = await prisma.openMonth.findFirst({
      where: {
        userId: userId,
        month: month,
      },
    });

    if (!openMonth) {
      return {
        success: false,
        error: "No se encontro la planificacion del mes",
      };
    }

    if (!openMonth.isPlanningConfirmed) {
      return {
        success: false,
        error: "La planificacion no esta confirmada",
      };
    }

    await prisma.openMonth.update({
      where: {
        id: openMonth.id,
      },
      data: {
        isPlanningConfirmed: false,
        planningConfirmedAt: null,
      },
    });

    revalidatePath("/big-rocks");
    revalidatePath(`/big-rocks?month=${month}`);
    revalidatePath("/supervisor");

    return { success: true };
  } catch (error) {
    console.error("Error unconfirming month planning:", error);
    return {
      success: false,
      error: "Error al desconfirmar la planificacion del mes",
    };
  }
}

/**
 * Get list of supervisees with their planning status for a specific month
 * Only for supervisors and admins
 */
export async function getSuperviseesWithPlanningStatus(
  month: string
): Promise<SuperviseeWithStatus[]> {
  const user = await requireAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userRole = (user as any).role as UserRole;

  if (userRole !== "SUPERVISOR" && userRole !== "ADMIN" && userRole !== "SUPERADMIN") {
    throw new Error("No tienes permiso para ver supervisados");
  }

  // Get supervisees
  const supervisees = await prisma.user.findMany({
    where: {
      supervisorId: user.id,
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  // Get planning status for each supervisee
  const result: SuperviseeWithStatus[] = [];

  for (const supervisee of supervisees) {
    // Get Big Rocks count
    const bigRocks = await prisma.bigRock.findMany({
      where: {
        userId: supervisee.id,
        month: month,
      },
      select: {
        id: true,
        status: true,
      },
    });

    // Get OpenMonth record
    const openMonth = await prisma.openMonth.findFirst({
      where: {
        userId: supervisee.id,
        month: month,
      },
      select: {
        isPlanningConfirmed: true,
        planningConfirmedAt: true,
      },
    });

    const totalBigRocks = bigRocks.length;
    // A Big Rock is "confirmed" if status is not CREADO
    const confirmedBigRocks = bigRocks.filter((br) => br.status !== "CREADO").length;
    const allConfirmed = totalBigRocks > 0 && confirmedBigRocks === totalBigRocks;

    result.push({
      id: supervisee.id,
      name: supervisee.name,
      email: supervisee.email,
      image: supervisee.image,
      planningStatus: {
        month,
        totalBigRocks,
        confirmedBigRocks,
        isPlanningConfirmed: openMonth?.isPlanningConfirmed ?? false,
        planningConfirmedAt: openMonth?.planningConfirmedAt ?? null,
        canConfirmPlanning: allConfirmed && !(openMonth?.isPlanningConfirmed),
      },
    });
  }

  return result;
}

/**
 * Get full planning data for a supervisee
 * Only accessible if the planning is confirmed
 */
export async function getSuperviseeMonthPlanning(
  superviseeId: string,
  month: string
): Promise<SuperviseePlanningData | null> {
  const user = await requireAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userRole = (user as any).role as UserRole;

  // Check if user is supervisor or admin
  if (userRole !== "SUPERVISOR" && userRole !== "ADMIN" && userRole !== "SUPERADMIN") {
    throw new Error("No tienes permiso para ver esta planificacion");
  }

  // Check if can view this supervisee's planning
  const canView = await canViewSuperviseePlanning(user.id, superviseeId, month);
  if (!canView && userRole !== "ADMIN" && userRole !== "SUPERADMIN") {
    return null;
  }

  // Get supervisee info
  const supervisee = await prisma.user.findUnique({
    where: { id: superviseeId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
    },
  });

  if (!supervisee) {
    return null;
  }

  // Get OpenMonth record
  const openMonth = await prisma.openMonth.findFirst({
    where: {
      userId: superviseeId,
      month: month,
    },
    select: {
      id: true,
      isPlanningConfirmed: true,
      planningConfirmedAt: true,
    },
  });

  // For non-admin, require planning to be confirmed
  if (!openMonth?.isPlanningConfirmed && userRole !== "ADMIN" && userRole !== "SUPERADMIN") {
    return null;
  }

  // Get all Big Rocks with details
  const bigRocks = await prisma.bigRock.findMany({
    where: {
      userId: superviseeId,
      month: month,
    },
    include: {
      tars: {
        select: {
          id: true,
          description: true,
          status: true,
        },
        orderBy: { createdAt: "asc" },
      },
      keyMeetings: {
        select: {
          id: true,
          title: true,
          date: true,
          completed: true,
        },
        orderBy: { date: "asc" },
      },
      keyPeople: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  // Get feedback for each Big Rock
  const bigRocksWithFeedback = await Promise.all(
    bigRocks.map(async (br) => {
      const feedback = await prisma.feedback.findFirst({
        where: {
          targetType: "BIG_ROCK",
          targetId: br.id,
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

      return {
        id: br.id,
        title: br.title,
        description: br.description,
        indicator: br.indicator,
        numTars: br.numTars,
        status: br.status,
        aiScore: br.aiScore,
        tars: br.tars,
        keyMeetings: br.keyMeetings,
        keyPeople: br.keyPeople,
        feedback,
      };
    })
  );

  // Get month feedback
  let monthFeedback = null;
  if (openMonth) {
    monthFeedback = await prisma.feedback.findFirst({
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
  }

  return {
    user: supervisee,
    month,
    isPlanningConfirmed: openMonth?.isPlanningConfirmed ?? false,
    planningConfirmedAt: openMonth?.planningConfirmedAt ?? null,
    bigRocks: bigRocksWithFeedback,
    monthFeedback,
  };
}
