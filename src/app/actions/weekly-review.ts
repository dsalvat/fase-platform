"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { getCurrentCompanyId } from "@/lib/company-context";
import { recordWeeklyReview } from "@/lib/gamification";
import { z } from "zod";

const weeklyReviewSchema = z.object({
  week: z.string().regex(/^\d{4}-W\d{2}$/),
  accomplishments: z.string().min(1).max(5000),
  blockers: z.string().min(1).max(5000),
  learnings: z.string().max(5000).default(""),
  nextWeekFocus: z.string().max(5000).default(""),
});

export async function createWeeklyReview(data: {
  week: string;
  accomplishments: string;
  blockers: string;
  learnings: string;
  nextWeekFocus: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireAuth();
    const companyId = await getCurrentCompanyId();

    if (!companyId) {
      return { success: false, error: "No se ha seleccionado empresa" };
    }

    const validated = weeklyReviewSchema.parse(data);

    // Check if review already exists
    const existing = await prisma.weeklyReview.findUnique({
      where: {
        userId_week_companyId: {
          userId: user.id,
          week: validated.week,
          companyId,
        },
      },
    });

    if (existing) {
      return { success: false, error: "Ya existe una revision para esta semana" };
    }

    await prisma.weeklyReview.create({
      data: {
        userId: user.id,
        companyId,
        week: validated.week,
        accomplishments: validated.accomplishments,
        blockers: validated.blockers,
        learnings: validated.learnings,
        nextWeekFocus: validated.nextWeekFocus,
      },
    });

    // Gamification: award points for weekly review
    try {
      await recordWeeklyReview(user.id);
    } catch (e) {
      console.error("Error recording weekly review gamification:", e);
    }

    revalidatePath("/revision-semanal");
    revalidatePath("/");

    return { success: true };
  } catch (error) {
    console.error("Error creating weekly review:", error);
    return {
      success: false,
      error: "Error al crear la revision semanal",
    };
  }
}

export async function updateWeeklyReview(
  id: string,
  data: {
    accomplishments: string;
    blockers: string;
    learnings: string;
    nextWeekFocus: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireAuth();

    const review = await prisma.weeklyReview.findUnique({
      where: { id },
    });

    if (!review || review.userId !== user.id) {
      return { success: false, error: "Revision no encontrada" };
    }

    await prisma.weeklyReview.update({
      where: { id },
      data: {
        accomplishments: data.accomplishments,
        blockers: data.blockers,
        learnings: data.learnings,
        nextWeekFocus: data.nextWeekFocus,
      },
    });

    revalidatePath("/revision-semanal");

    return { success: true };
  } catch (error) {
    console.error("Error updating weekly review:", error);
    return {
      success: false,
      error: "Error al actualizar la revision semanal",
    };
  }
}

export async function getWeeklyReview(week: string): Promise<{
  success: boolean;
  review?: {
    id: string;
    week: string;
    accomplishments: string;
    blockers: string;
    learnings: string;
    nextWeekFocus: string;
    createdAt: Date;
  };
  error?: string;
}> {
  try {
    const user = await requireAuth();
    const companyId = await getCurrentCompanyId();

    if (!companyId) {
      return { success: false, error: "No se ha seleccionado empresa" };
    }

    const review = await prisma.weeklyReview.findUnique({
      where: {
        userId_week_companyId: {
          userId: user.id,
          week,
          companyId,
        },
      },
    });

    if (!review) {
      return { success: true, review: undefined };
    }

    return {
      success: true,
      review: {
        id: review.id,
        week: review.week,
        accomplishments: review.accomplishments,
        blockers: review.blockers,
        learnings: review.learnings,
        nextWeekFocus: review.nextWeekFocus,
        createdAt: review.createdAt,
      },
    };
  } catch (error) {
    console.error("Error getting weekly review:", error);
    return {
      success: false,
      error: "Error al obtener la revision semanal",
    };
  }
}
