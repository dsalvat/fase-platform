"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { getCurrentCompanyId } from "@/lib/company-context";
import { isMonthReadOnly } from "@/lib/month-helpers";
import { generateBigRockProposals, BigRockProposal } from "@/lib/ai-generation";
import { recordBigRockCreated } from "@/lib/gamification";
import { logBigRockCreated } from "@/lib/activity-log";

/**
 * Generate AI Big Rock proposals for a given month.
 */
export async function getAIBigRockProposals(month: string): Promise<{
  success: boolean;
  proposals?: BigRockProposal[];
  error?: string;
}> {
  try {
    const user = await requireAuth();

    if (isMonthReadOnly(month)) {
      return {
        success: false,
        error: "No se pueden generar propuestas para meses pasados",
      };
    }

    const proposals = await generateBigRockProposals(user.id, month);

    if (proposals.length === 0) {
      return {
        success: false,
        error: "La IA no pudo generar propuestas. Intentalo de nuevo.",
      };
    }

    return { success: true, proposals };
  } catch (error) {
    console.error("Error generating AI proposals:", error);
    return {
      success: false,
      error: "Error al generar propuestas con IA",
    };
  }
}

/**
 * Create Big Rocks from selected AI proposals.
 */
export async function createBigRocksFromProposals(
  month: string,
  proposals: BigRockProposal[]
): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const user = await requireAuth();
    const companyId = await getCurrentCompanyId();

    if (isMonthReadOnly(month)) {
      return {
        success: false,
        error: "No se pueden crear Big Rocks para meses pasados",
      };
    }

    if (proposals.length === 0) {
      return { success: false, error: "No hay propuestas seleccionadas" };
    }

    const created: { id: string; title: string }[] = [];

    for (const proposal of proposals) {
      const bigRock = await prisma.bigRock.create({
        data: {
          title: proposal.title,
          description: proposal.description,
          indicator: proposal.indicator,
          numTars: proposal.numTars,
          month,
          status: "CREADO",
          category: proposal.category,
          userId: user.id,
          companyId,
        },
      });
      created.push({ id: bigRock.id, title: bigRock.title });
    }

    // Gamification and activity logs (non-critical)
    for (const br of created) {
      try {
        await recordBigRockCreated(user.id);
      } catch (e) {
        console.error("Error recording gamification:", e);
      }
      try {
        await logBigRockCreated(user.id, br.id, br.title);
      } catch (e) {
        console.error("Error recording activity log:", e);
      }
    }

    revalidatePath("/big-rocks");
    revalidatePath(`/big-rocks?month=${month}`);

    return { success: true, count: created.length };
  } catch (error) {
    console.error("Error creating Big Rocks from proposals:", error);
    return {
      success: false,
      error: "Error al crear los Big Rocks",
    };
  }
}
