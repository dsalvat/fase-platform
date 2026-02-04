import { prisma } from "@/lib/db";
import { LogEntityType, LogActionType, UserRole, Prisma } from "@prisma/client";
import type { ActivityLogWithUser, PaginatedActivityLogs, ViewableUser } from "@/types/activity-log";
import type { ActivityLogQueryInput } from "@/lib/validations/activity-log";

/**
 * Record an activity log entry
 */
export async function recordActivityLog(input: {
  action: LogActionType;
  entityType: LogEntityType;
  entityId: string;
  description: string;
  entityTitle?: string;
  metadata?: Record<string, unknown>;
  userId: string;
}): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        description: input.description,
        entityTitle: input.entityTitle,
        metadata: input.metadata as Prisma.JsonObject | undefined,
        userId: input.userId,
      },
    });
  } catch (error) {
    console.error("Error recording activity log:", error);
    // Don't throw - activity logging should not break main operations
  }
}

/**
 * Get activity logs with role-based access control
 */
export async function getActivityLogs(
  userId: string,
  userRole: UserRole,
  params: ActivityLogQueryInput
): Promise<PaginatedActivityLogs> {
  const { page, limit, entityType, action, userId: filterUserId } = params;
  const skip = (page - 1) * limit;

  // Build where clause based on role
  const where: Prisma.ActivityLogWhereInput = {};

  // Get viewable user IDs based on role
  const viewableUserIds = await getViewableUserIds(userId, userRole);

  // Apply user filter
  if (filterUserId) {
    // Only allow filtering by users the current user can view
    if (viewableUserIds.includes(filterUserId)) {
      where.userId = filterUserId;
    } else {
      // Return empty result if trying to filter by non-viewable user
      return {
        logs: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
          hasMore: false,
        },
      };
    }
  } else {
    // Filter by all viewable users
    where.userId = { in: viewableUserIds };
  }

  // Apply entity type filter
  if (entityType) {
    where.entityType = entityType;
  }

  // Apply action filter
  if (action) {
    where.action = action;
  }

  // Get total count and logs in parallel
  const [total, logs] = await Promise.all([
    prisma.activityLog.count({ where }),
    prisma.activityLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    logs: logs as ActivityLogWithUser[],
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasMore: page < totalPages,
    },
  };
}

/**
 * Get IDs of users whose activity logs the current user can view
 */
export async function getViewableUserIds(
  userId: string,
  userRole: UserRole
): Promise<string[]> {
  if (userRole === "ADMIN") {
    // Admin can see all users
    const users = await prisma.user.findMany({
      select: { id: true },
    });
    return users.map((u) => u.id);
  }

  if (userRole === "SUPERVISOR") {
    // Supervisor can see themselves and their supervisees
    const supervisees = await prisma.user.findMany({
      where: { supervisorId: userId },
      select: { id: true },
    });
    return [userId, ...supervisees.map((u) => u.id)];
  }

  // Regular user can only see their own logs
  return [userId];
}

/**
 * Get users visible to the current user for filter dropdown
 */
export async function getViewableUsers(
  userId: string,
  userRole: UserRole
): Promise<ViewableUser[]> {
  const viewableUserIds = await getViewableUserIds(userId, userRole);

  const users = await prisma.user.findMany({
    where: { id: { in: viewableUserIds } },
    select: {
      id: true,
      name: true,
      email: true,
    },
    orderBy: { name: "asc" },
  });

  return users;
}

// ========================
// Helper functions for logging entity operations
// ========================

// Big Rock helpers
export async function logBigRockCreated(
  userId: string,
  bigRockId: string,
  title: string
): Promise<void> {
  await recordActivityLog({
    action: "CREATE",
    entityType: "BIG_ROCK",
    entityId: bigRockId,
    description: `Creo el Big Rock "${title}"`,
    entityTitle: title,
    userId,
  });
}

export async function logBigRockUpdated(
  userId: string,
  bigRockId: string,
  title: string,
  changes?: Record<string, unknown>
): Promise<void> {
  await recordActivityLog({
    action: "UPDATE",
    entityType: "BIG_ROCK",
    entityId: bigRockId,
    description: `Actualizo el Big Rock "${title}"`,
    entityTitle: title,
    metadata: changes,
    userId,
  });
}

export async function logBigRockDeleted(
  userId: string,
  bigRockId: string,
  title: string
): Promise<void> {
  await recordActivityLog({
    action: "DELETE",
    entityType: "BIG_ROCK",
    entityId: bigRockId,
    description: `Elimino el Big Rock "${title}"`,
    entityTitle: title,
    userId,
  });
}

// TAR helpers
export async function logTARCreated(
  userId: string,
  tarId: string,
  description: string
): Promise<void> {
  const truncatedDesc = description.length > 50
    ? description.substring(0, 50) + "..."
    : description;
  await recordActivityLog({
    action: "CREATE",
    entityType: "TAR",
    entityId: tarId,
    description: `Creo la TAR "${truncatedDesc}"`,
    entityTitle: truncatedDesc,
    userId,
  });
}

export async function logTARUpdated(
  userId: string,
  tarId: string,
  description: string,
  changes?: Record<string, unknown>
): Promise<void> {
  const truncatedDesc = description.length > 50
    ? description.substring(0, 50) + "..."
    : description;
  await recordActivityLog({
    action: "UPDATE",
    entityType: "TAR",
    entityId: tarId,
    description: `Actualizo la TAR "${truncatedDesc}"`,
    entityTitle: truncatedDesc,
    metadata: changes,
    userId,
  });
}

export async function logTARDeleted(
  userId: string,
  tarId: string,
  description: string
): Promise<void> {
  const truncatedDesc = description.length > 50
    ? description.substring(0, 50) + "..."
    : description;
  await recordActivityLog({
    action: "DELETE",
    entityType: "TAR",
    entityId: tarId,
    description: `Elimino la TAR "${truncatedDesc}"`,
    entityTitle: truncatedDesc,
    userId,
  });
}

// Activity helpers
export async function logActivityCreated(
  userId: string,
  activityId: string,
  title: string
): Promise<void> {
  await recordActivityLog({
    action: "CREATE",
    entityType: "ACTIVITY",
    entityId: activityId,
    description: `Creo la actividad "${title}"`,
    entityTitle: title,
    userId,
  });
}

export async function logActivityUpdated(
  userId: string,
  activityId: string,
  title: string,
  changes?: Record<string, unknown>
): Promise<void> {
  await recordActivityLog({
    action: "UPDATE",
    entityType: "ACTIVITY",
    entityId: activityId,
    description: `Actualizo la actividad "${title}"`,
    entityTitle: title,
    metadata: changes,
    userId,
  });
}

export async function logActivityDeleted(
  userId: string,
  activityId: string,
  title: string
): Promise<void> {
  await recordActivityLog({
    action: "DELETE",
    entityType: "ACTIVITY",
    entityId: activityId,
    description: `Elimino la actividad "${title}"`,
    entityTitle: title,
    userId,
  });
}

// Key Meeting helpers
export async function logKeyMeetingCreated(
  userId: string,
  keyMeetingId: string,
  title: string
): Promise<void> {
  await recordActivityLog({
    action: "CREATE",
    entityType: "KEY_MEETING",
    entityId: keyMeetingId,
    description: `Creo la reunion clave "${title}"`,
    entityTitle: title,
    userId,
  });
}

export async function logKeyMeetingUpdated(
  userId: string,
  keyMeetingId: string,
  title: string,
  changes?: Record<string, unknown>
): Promise<void> {
  await recordActivityLog({
    action: "UPDATE",
    entityType: "KEY_MEETING",
    entityId: keyMeetingId,
    description: `Actualizo la reunion clave "${title}"`,
    entityTitle: title,
    metadata: changes,
    userId,
  });
}

export async function logKeyMeetingDeleted(
  userId: string,
  keyMeetingId: string,
  title: string
): Promise<void> {
  await recordActivityLog({
    action: "DELETE",
    entityType: "KEY_MEETING",
    entityId: keyMeetingId,
    description: `Elimino la reunion clave "${title}"`,
    entityTitle: title,
    userId,
  });
}

// ========================
// Supervisee changes for chat notifications
// ========================

export interface SuperviseeChange {
  action: LogActionType;
  entityType: LogEntityType;
  entityId: string;
  entityTitle: string | null;
  description: string;
  link: string;
  createdAt: Date;
}

export interface SuperviseeChangesGroup {
  superviseeId: string;
  superviseeName: string;
  superviseeEmail: string;
  changes: SuperviseeChange[];
}

/**
 * Get changes made by supervisees since a given date
 */
export async function getSuperviseeChanges(
  supervisorId: string,
  since: Date | null
): Promise<SuperviseeChangesGroup[]> {
  // Get all supervisees
  const supervisees = await prisma.user.findMany({
    where: { supervisorId },
    select: { id: true, name: true, email: true },
  });

  if (supervisees.length === 0) {
    return [];
  }

  const superviseeIds = supervisees.map((s) => s.id);

  // Build where clause
  const where: Prisma.ActivityLogWhereInput = {
    userId: { in: superviseeIds },
  };

  if (since) {
    where.createdAt = { gt: since };
  }

  // Get activity logs
  const logs = await prisma.activityLog.findMany({
    where,
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50, // Limit to last 50 changes
  });

  // Group by supervisee
  const groupedChanges = new Map<string, SuperviseeChangesGroup>();

  for (const log of logs) {
    const link = await buildEntityLink(log.entityType, log.entityId);

    const change: SuperviseeChange = {
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      entityTitle: log.entityTitle,
      description: log.description,
      link,
      createdAt: log.createdAt,
    };

    const existing = groupedChanges.get(log.userId);
    if (existing) {
      existing.changes.push(change);
    } else {
      groupedChanges.set(log.userId, {
        superviseeId: log.userId,
        superviseeName: log.user.name || log.user.email,
        superviseeEmail: log.user.email,
        changes: [change],
      });
    }
  }

  return Array.from(groupedChanges.values());
}

/**
 * Build a link to the entity based on its type
 */
async function buildEntityLink(
  entityType: LogEntityType,
  entityId: string
): Promise<string> {
  try {
    switch (entityType) {
      case "BIG_ROCK":
        return `/big-rocks/${entityId}`;

      case "TAR": {
        const tar = await prisma.tAR.findUnique({
          where: { id: entityId },
          select: { bigRockId: true },
        });
        if (tar) {
          return `/big-rocks/${tar.bigRockId}/tars/${entityId}`;
        }
        return `/big-rocks`;
      }

      case "ACTIVITY": {
        const activity = await prisma.activity.findUnique({
          where: { id: entityId },
          select: {
            tarId: true,
            tar: { select: { bigRockId: true } },
          },
        });
        if (activity) {
          return `/big-rocks/${activity.tar.bigRockId}/tars/${activity.tarId}/activities/${entityId}`;
        }
        return `/big-rocks`;
      }

      case "KEY_MEETING": {
        const meeting = await prisma.keyMeeting.findUnique({
          where: { id: entityId },
          select: { bigRockId: true },
        });
        if (meeting) {
          return `/big-rocks/${meeting.bigRockId}/meetings/${entityId}`;
        }
        return `/big-rocks`;
      }

      default:
        return `/big-rocks`;
    }
  } catch {
    return `/big-rocks`;
  }
}
