import { getServerSession } from "next-auth";
import { UserRole } from "@prisma/client";
import { authOptions } from "./auth-options";

/**
 * Get the current company ID based on user context
 * All users now use currentCompanyId (empresa seleccionada)
 */
export async function getCurrentCompanyId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  return session.user.currentCompanyId;
}

/**
 * Check if current user is SUPERADMIN
 */
export async function isSuperAdmin(): Promise<boolean> {
  const session = await getServerSession(authOptions);
  return session?.user?.role === UserRole.SUPERADMIN;
}

/**
 * Check if current user can manage companies (only SUPERADMIN)
 */
export async function canManageCompanies(): Promise<boolean> {
  return isSuperAdmin();
}

/**
 * Get the current user's companies
 */
export async function getUserCompanies(): Promise<{ id: string; name: string; logo: string | null }[]> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return [];
  return session.user.companies || [];
}

/**
 * Check if user has multiple companies (needs company switcher)
 */
export async function hasMultipleCompanies(): Promise<boolean> {
  const companies = await getUserCompanies();
  return companies.length > 1;
}

/**
 * Check if user can switch companies (SUPERADMIN or user with multiple companies)
 */
export async function canSwitchCompanies(): Promise<boolean> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return false;

  // SUPERADMIN can always switch
  if (session.user.role === UserRole.SUPERADMIN) return true;

  // Users with multiple companies can switch
  return (session.user.companies?.length || 0) > 1;
}
