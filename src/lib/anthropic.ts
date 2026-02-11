import Anthropic from "@anthropic-ai/sdk";

const globalForAnthropic = globalThis as unknown as {
  anthropic: Anthropic | undefined;
};

export const anthropic =
  globalForAnthropic.anthropic ??
  new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

if (process.env.NODE_ENV !== "production") globalForAnthropic.anthropic = anthropic;

// Constants for chat
export const DAILY_CREDITS = 10;
export const CREDITS_PER_MESSAGE = 1;
export const CLAUDE_MODEL = "claude-sonnet-4-20250514";
export const MAX_TOKENS = 1024;
export const AI_EVALUATION_MAX_TOKENS = 2048;
export const AI_GENERATION_MAX_TOKENS = 4096;
