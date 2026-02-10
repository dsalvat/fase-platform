import { prisma } from "@/lib/db";

/**
 * Fetches the user's personal AI context for a given company.
 * Returns a formatted text block to inject into AI prompts, or null if no context is defined.
 */
export async function getUserAIContext(
  userId: string,
  companyId: string
): Promise<string | null> {
  const uc = await prisma.userCompany.findUnique({
    where: {
      userId_companyId: { userId, companyId },
    },
    select: {
      contextRole: true,
      contextResponsibilities: true,
      contextObjectives: true,
      contextYearPriorities: true,
    },
  });

  if (!uc) return null;

  const parts: string[] = [];

  if (uc.contextRole) {
    parts.push(`- Cargo/Rol: ${uc.contextRole}`);
  }
  if (uc.contextResponsibilities) {
    parts.push(`- Responsabilidades: ${uc.contextResponsibilities}`);
  }
  if (uc.contextObjectives) {
    parts.push(`- Objetivos y prioridades generales: ${uc.contextObjectives}`);
  }
  if (uc.contextYearPriorities) {
    parts.push(`- Prioridades del año en curso: ${uc.contextYearPriorities}`);
  }

  if (parts.length === 0) return null;

  return `Contexto del usuario:\n${parts.join("\n")}`;
}
