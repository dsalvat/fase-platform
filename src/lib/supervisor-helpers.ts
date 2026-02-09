import { prisma } from "@/lib/db";

/**
 * Check if supervisorId is the supervisor of userId within a specific company.
 */
export async function isSupervisorInCompany(
  supervisorId: string,
  userId: string,
  companyId: string
): Promise<boolean> {
  const uc = await prisma.userCompany.findUnique({
    where: { userId_companyId: { userId, companyId } },
    select: { supervisorId: true },
  });
  return uc?.supervisorId === supervisorId;
}

/**
 * Get all supervisees of a supervisor within a specific company, with user data.
 */
export async function getSuperviseesInCompany(
  supervisorId: string,
  companyId: string
) {
  const ucs = await prisma.userCompany.findMany({
    where: { supervisorId, companyId },
    select: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  });
  return ucs.map((uc) => uc.user);
}

/**
 * Check for circular supervisor chains within a company.
 * Returns true if assigning supervisorId as supervisor of targetUserId
 * would create a circular reference.
 */
export async function checkSupervisorChainInCompany(
  supervisorId: string,
  targetUserId: string,
  companyId: string
): Promise<boolean> {
  let currentId: string | null = supervisorId;
  const visited = new Set<string>();

  while (currentId) {
    if (currentId === targetUserId) return true;
    if (visited.has(currentId)) break;
    visited.add(currentId);

    const uc: { supervisorId: string | null } | null = await prisma.userCompany.findUnique({
      where: { userId_companyId: { userId: currentId, companyId } },
      select: { supervisorId: true },
    });
    currentId = uc?.supervisorId ?? null;
  }
  return false;
}
