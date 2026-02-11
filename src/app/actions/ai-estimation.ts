"use server";

import { requireAuth } from "@/lib/auth";
import { getCurrentCompanyId } from "@/lib/company-context";
import { anthropic, CLAUDE_MODEL, AI_EVALUATION_MAX_TOKENS, AI_GENERATION_MAX_TOKENS } from "@/lib/anthropic";
import { buildBigRockEvaluationMessages, buildMonthEvaluationMessages } from "@/lib/ai-evaluation";
import { buildGenerationMessages } from "@/lib/ai-generation";

interface TokenEstimate {
  inputTokens: number;
  maxOutputTokens: number;
}

/**
 * Estimate tokens for evaluating a single Big Rock.
 */
export async function estimateBigRockEvaluationTokens(
  bigRockId: string
): Promise<{ success: boolean; estimate?: TokenEstimate; error?: string }> {
  try {
    await requireAuth();

    const messages = await buildBigRockEvaluationMessages(bigRockId);
    if (!messages) {
      return { success: false, error: "Big Rock no encontrado" };
    }

    const result = await anthropic.messages.countTokens({
      model: CLAUDE_MODEL,
      system: messages.system,
      messages: [{ role: "user", content: messages.userMessage }],
    });

    return {
      success: true,
      estimate: {
        inputTokens: result.input_tokens,
        maxOutputTokens: AI_EVALUATION_MAX_TOKENS,
      },
    };
  } catch (error) {
    console.error("Error estimating Big Rock evaluation tokens:", error);
    return { success: false, error: "Error al estimar tokens" };
  }
}

/**
 * Estimate tokens for evaluating month planning.
 */
export async function estimateMonthEvaluationTokens(
  month: string
): Promise<{ success: boolean; estimate?: TokenEstimate; error?: string }> {
  try {
    const user = await requireAuth();
    const companyId = await getCurrentCompanyId();

    if (!companyId) {
      return { success: false, error: "No se ha seleccionado empresa" };
    }

    const messages = await buildMonthEvaluationMessages(user.id, month, companyId);
    if (!messages) {
      return { success: false, error: "No hay Big Rocks para este mes" };
    }

    const result = await anthropic.messages.countTokens({
      model: CLAUDE_MODEL,
      system: messages.system,
      messages: [{ role: "user", content: messages.userMessage }],
    });

    return {
      success: true,
      estimate: {
        inputTokens: result.input_tokens,
        maxOutputTokens: AI_EVALUATION_MAX_TOKENS,
      },
    };
  } catch (error) {
    console.error("Error estimating month evaluation tokens:", error);
    return { success: false, error: "Error al estimar tokens" };
  }
}

/**
 * Estimate tokens for generating AI Big Rock proposals.
 */
export async function estimateGenerationTokens(
  month: string
): Promise<{ success: boolean; estimate?: TokenEstimate; error?: string }> {
  try {
    const user = await requireAuth();
    const companyId = await getCurrentCompanyId();

    if (!companyId) {
      return { success: false, error: "No se ha seleccionado empresa" };
    }

    const messages = await buildGenerationMessages(user.id, month, companyId);

    const result = await anthropic.messages.countTokens({
      model: CLAUDE_MODEL,
      system: messages.system,
      messages: [{ role: "user", content: messages.userMessage }],
    });

    return {
      success: true,
      estimate: {
        inputTokens: result.input_tokens,
        maxOutputTokens: AI_GENERATION_MAX_TOKENS,
      },
    };
  } catch (error) {
    console.error("Error estimating generation tokens:", error);
    return { success: false, error: "Error al estimar tokens" };
  }
}
