import { getServerSession } from "next-auth";
import { UserRole, FeedbackTargetType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth-options";
import { isSupervisorInCompany } from "@/lib/supervisor-helpers";

/**
 * Require authentication - throws error if user is not authenticated
 * @returns Authenticated user session
 * @throws Error if not authenticated
 */
export async function requireAuth() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  return session.user;
}

/**
 * Require specific role - throws error if user doesn't have required role
 * @param allowedRoles - Array of allowed roles
 * @returns Authenticated user with verified role
 * @throws Error if not authenticated or doesn't have required role
 */
export async function requireRole(allowedRoles: UserRole[]) {
  const user = await requireAuth();

  // Type assertion needed because NextAuth user doesn't include role by default
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userRole = (user as any).role as UserRole;

  if (!allowedRoles.includes(userRole)) {
    throw new Error("Forbidden");
  }

  return { ...user, role: userRole };
}

/**
 * Check if user can access a specific Big Rock
 * Uses per-company supervisor relationship via UserCompany
 */
export async function canAccessBigRock(
  bigRockId: string,
  userId: string,
  userRole: UserRole
): Promise<boolean> {
  const bigRock = await prisma.bigRock.findUnique({
    where: { id: bigRockId },
    select: {
      userId: true,
      companyId: true,
    },
  });

  if (!bigRock) {
    return false;
  }

  // Owner can always access
  if (bigRock.userId === userId) {
    return true;
  }

  // SUPERADMIN can access all
  if (userRole === "SUPERADMIN") {
    return true;
  }

  // Admin can access all within their company
  if (userRole === "ADMIN") {
    return true;
  }

  // Supervisor can access if they supervise the owner in the BigRock's company
  if (userRole === "SUPERVISOR" && bigRock.companyId) {
    const isSup = await isSupervisorInCompany(userId, bigRock.userId, bigRock.companyId);
    if (isSup) return true;
  }

  return false;
}

/**
 * Check if a month is read-only (in the past)
 * @param month - Month string in YYYY-MM format
 * @returns true if month is in the past, false otherwise
 */
export function isMonthReadOnly(month: string): boolean {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  return month < currentMonth;
}

/**
 * Check if user can modify a Big Rock (not read-only month and has permission)
 */
export async function canModifyBigRock(
  bigRockId: string,
  userId: string,
  userRole: UserRole
): Promise<boolean> {
  const bigRock = await prisma.bigRock.findUnique({
    where: { id: bigRockId },
    select: {
      userId: true,
      month: true,
    },
  });

  if (!bigRock) {
    return false;
  }

  // Check if month is read-only
  if (isMonthReadOnly(bigRock.month)) {
    return false;
  }

  // Only owner, admin or superadmin can modify
  if (bigRock.userId === userId) {
    return true;
  }

  if (userRole === "SUPERADMIN") {
    return true;
  }

  if (userRole === "ADMIN") {
    return true;
  }

  return false;
}

/**
 * Check if user can access a specific TAR
 * Uses per-company supervisor relationship via UserCompany
 */
export async function canAccessTAR(
  tarId: string,
  userId: string,
  userRole: UserRole
): Promise<boolean> {
  const tar = await prisma.tAR.findUnique({
    where: { id: tarId },
    include: {
      bigRock: {
        select: {
          userId: true,
          companyId: true,
        },
      },
    },
  });

  if (!tar) {
    return false;
  }

  // Owner can always access
  if (tar.bigRock.userId === userId) {
    return true;
  }

  // SUPERADMIN can access all
  if (userRole === "SUPERADMIN") {
    return true;
  }

  // Admin can access all within their company
  if (userRole === "ADMIN") {
    return true;
  }

  // Supervisor can access if they supervise the owner in the BigRock's company
  if (userRole === "SUPERVISOR" && tar.bigRock.companyId) {
    const isSup = await isSupervisorInCompany(userId, tar.bigRock.userId, tar.bigRock.companyId);
    if (isSup) return true;
  }

  return false;
}

/**
 * Check if user can modify a TAR (not read-only month and has permission)
 */
export async function canModifyTAR(
  tarId: string,
  userId: string,
  userRole: UserRole
): Promise<boolean> {
  const tar = await prisma.tAR.findUnique({
    where: { id: tarId },
    include: {
      bigRock: {
        select: {
          userId: true,
          month: true,
        },
      },
    },
  });

  if (!tar) {
    return false;
  }

  // Check if month is read-only
  if (isMonthReadOnly(tar.bigRock.month)) {
    return false;
  }

  // Only owner, admin or superadmin can modify
  if (tar.bigRock.userId === userId) {
    return true;
  }

  if (userRole === "SUPERADMIN") {
    return true;
  }

  if (userRole === "ADMIN") {
    return true;
  }

  return false;
}

/**
 * Check if user can access a specific Activity
 * Uses per-company supervisor relationship via UserCompany
 */
export async function canAccessActivity(
  activityId: string,
  userId: string,
  userRole: UserRole
): Promise<boolean> {
  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
    include: {
      tar: {
        include: {
          bigRock: {
            select: {
              userId: true,
              companyId: true,
            },
          },
        },
      },
    },
  });

  if (!activity) {
    return false;
  }

  // Owner can always access
  if (activity.tar.bigRock.userId === userId) {
    return true;
  }

  // SUPERADMIN can access all
  if (userRole === "SUPERADMIN") {
    return true;
  }

  // Admin can access all within their company
  if (userRole === "ADMIN") {
    return true;
  }

  // Supervisor can access if they supervise the owner in the BigRock's company
  if (userRole === "SUPERVISOR" && activity.tar.bigRock.companyId) {
    const isSup = await isSupervisorInCompany(userId, activity.tar.bigRock.userId, activity.tar.bigRock.companyId);
    if (isSup) return true;
  }

  return false;
}

/**
 * Check if user can modify an Activity (not read-only month and has permission)
 */
export async function canModifyActivity(
  activityId: string,
  userId: string,
  userRole: UserRole
): Promise<boolean> {
  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
    include: {
      tar: {
        include: {
          bigRock: {
            select: {
              userId: true,
              month: true,
            },
          },
        },
      },
    },
  });

  if (!activity) {
    return false;
  }

  // Check if month is read-only
  if (isMonthReadOnly(activity.tar.bigRock.month)) {
    return false;
  }

  // Only owner, admin or superadmin can modify
  if (activity.tar.bigRock.userId === userId) {
    return true;
  }

  if (userRole === "SUPERADMIN") {
    return true;
  }

  if (userRole === "ADMIN") {
    return true;
  }

  return false;
}

/**
 * Check if user can access a specific KeyMeeting
 * Uses per-company supervisor relationship via UserCompany
 */
export async function canAccessKeyMeeting(
  keyMeetingId: string,
  userId: string,
  userRole: UserRole
): Promise<boolean> {
  const keyMeeting = await prisma.keyMeeting.findUnique({
    where: { id: keyMeetingId },
    include: {
      bigRock: {
        select: {
          userId: true,
          companyId: true,
        },
      },
    },
  });

  if (!keyMeeting) {
    return false;
  }

  // Owner can always access
  if (keyMeeting.bigRock.userId === userId) {
    return true;
  }

  // SUPERADMIN can access all
  if (userRole === "SUPERADMIN") {
    return true;
  }

  // Admin can access all within their company
  if (userRole === "ADMIN") {
    return true;
  }

  // Supervisor can access if they supervise the owner in the BigRock's company
  if (userRole === "SUPERVISOR" && keyMeeting.bigRock.companyId) {
    const isSup = await isSupervisorInCompany(userId, keyMeeting.bigRock.userId, keyMeeting.bigRock.companyId);
    if (isSup) return true;
  }

  return false;
}

/**
 * Check if user can modify a KeyMeeting (not read-only month and has permission)
 */
export async function canModifyKeyMeeting(
  keyMeetingId: string,
  userId: string,
  userRole: UserRole
): Promise<boolean> {
  const keyMeeting = await prisma.keyMeeting.findUnique({
    where: { id: keyMeetingId },
    include: {
      bigRock: {
        select: {
          userId: true,
          month: true,
        },
      },
    },
  });

  if (!keyMeeting) {
    return false;
  }

  // Check if month is read-only
  if (isMonthReadOnly(keyMeeting.bigRock.month)) {
    return false;
  }

  // Only owner, admin or superadmin can modify
  if (keyMeeting.bigRock.userId === userId) {
    return true;
  }

  if (userRole === "SUPERADMIN") {
    return true;
  }

  if (userRole === "ADMIN") {
    return true;
  }

  return false;
}

/**
 * Check if supervisor can view a supervisee's planning for a month
 * Uses per-company supervisor relationship via UserCompany
 * @param companyId - Optional company ID for scoped check
 */
export async function canViewSuperviseePlanning(
  supervisorId: string,
  superviseeId: string,
  month: string,
  companyId?: string | null
): Promise<boolean> {
  // Verify the supervisor-supervisee relationship (per-company)
  if (companyId) {
    const isSup = await isSupervisorInCompany(supervisorId, superviseeId, companyId);
    if (!isSup) return false;
  } else {
    // Fallback: check across all companies
    const uc = await prisma.userCompany.findFirst({
      where: { userId: superviseeId, supervisorId },
    });
    if (!uc) return false;
  }

  // Check if the month planning is confirmed
  const openMonth = await prisma.openMonth.findFirst({
    where: {
      userId: superviseeId,
      month: month,
      isPlanningConfirmed: true,
    },
  });

  return !!openMonth;
}

/**
 * Check if user can give feedback to a target (Big Rock or Month Planning)
 * Uses per-company supervisor relationship via UserCompany
 */
export async function canGiveFeedback(
  supervisorId: string,
  targetType: FeedbackTargetType,
  targetId: string
): Promise<boolean> {
  if (targetType === "BIG_ROCK") {
    // Get the Big Rock with companyId
    const bigRock = await prisma.bigRock.findUnique({
      where: { id: targetId },
      select: {
        userId: true,
        companyId: true,
        status: true,
        month: true,
      },
    });

    if (!bigRock) {
      return false;
    }

    // Big Rock must be confirmed (status !== CREADO)
    if (bigRock.status === "CREADO") {
      return false;
    }

    // Check supervisor relationship in the BigRock's company
    if (bigRock.companyId) {
      const isSup = await isSupervisorInCompany(supervisorId, bigRock.userId, bigRock.companyId);
      if (!isSup) return false;
    } else {
      // No company on BigRock, check any company
      const uc = await prisma.userCompany.findFirst({
        where: { userId: bigRock.userId, supervisorId },
      });
      if (!uc) return false;
    }

    // Check if the month planning is confirmed
    const openMonth = await prisma.openMonth.findFirst({
      where: {
        userId: bigRock.userId,
        month: bigRock.month,
        isPlanningConfirmed: true,
      },
    });

    return !!openMonth;
  }

  if (targetType === "MONTH_PLANNING") {
    // Get the OpenMonth and its owner
    const openMonth = await prisma.openMonth.findUnique({
      where: { id: targetId },
      select: {
        userId: true,
        isPlanningConfirmed: true,
      },
    });

    if (!openMonth) {
      return false;
    }

    // Check if supervisor relationship exists in any shared company
    const uc = await prisma.userCompany.findFirst({
      where: { userId: openMonth.userId, supervisorId },
    });

    return !!uc && openMonth.isPlanningConfirmed;
  }

  return false;
}
