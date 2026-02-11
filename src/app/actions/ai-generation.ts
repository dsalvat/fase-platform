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
    const companyId = await getCurrentCompanyId();

    if (!companyId) {
      return { success: false, error: "No se ha seleccionado empresa" };
    }

    if (isMonthReadOnly(month)) {
      return {
        success: false,
        error: "No se pueden generar propuestas para meses pasados",
      };
    }

    const proposals = await generateBigRockProposals(user.id, month, companyId);

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

    // Parse month to distribute meeting dates across weeks
    const [yearStr, monthStr] = month.split("-");
    const monthDate = new Date(Number(yearStr), Number(monthStr) - 1, 1);

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

      // Create TARs
      if (proposal.tars && proposal.tars.length > 0) {
        for (const tar of proposal.tars) {
          await prisma.tAR.create({
            data: {
              description: tar.description,
              bigRockId: bigRock.id,
            },
          });
        }
      }

      // Create Key Meetings with dates distributed across the month
      if (proposal.meetings && proposal.meetings.length > 0) {
        for (let i = 0; i < proposal.meetings.length; i++) {
          const meeting = proposal.meetings[i];
          // Distribute meetings: week 1, 2, 3 of the month
          const meetingDay = 7 * (i + 1);
          const meetingDate = new Date(monthDate);
          meetingDate.setDate(Math.min(meetingDay, 28));

          await prisma.keyMeeting.create({
            data: {
              title: meeting.title,
              objective: meeting.objective || null,
              expectedDecision: meeting.expectedDecision || null,
              date: meetingDate,
              bigRockId: bigRock.id,
            },
          });
        }
      }

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
