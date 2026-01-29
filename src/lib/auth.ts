import { getServerSession } from "next-auth";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth-options";

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
 * @param bigRockId - ID of the Big Rock to check
 * @param userId - ID of the user requesting access
 * @param userRole - Role of the user
 * @returns true if user can access, false otherwise
 */
export async function canAccessBigRock(
  bigRockId: string,
  userId: string,
  userRole: UserRole
): Promise<boolean> {
  const bigRock = await prisma.bigRock.findUnique({
    where: { id: bigRockId },
    include: {
      user: {
        select: {
          id: true,
          supervisorId: true,
        },
      },
    },
  });

  if (!bigRock) {
    return false;
  }

  // Owner can always access
  if (bigRock.userId === userId) {
    return true;
  }

  // Admin can access all
  if (userRole === "ADMIN") {
    return true;
  }

  // Supervisor can access if they supervise the owner
  if (userRole === "SUPERVISOR" && bigRock.user.supervisorId === userId) {
    return true;
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
 * @param bigRockId - ID of the Big Rock
 * @param userId - ID of the user
 * @param userRole - Role of the user
 * @returns true if can modify, false otherwise
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

  // Only owner or admin can modify
  if (bigRock.userId === userId) {
    return true;
  }

  if (userRole === "ADMIN") {
    return true;
  }

  return false;
}
