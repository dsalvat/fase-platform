"use server";

import { revalidatePath } from "next/cache";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { anthropic, DAILY_CREDITS, CREDITS_PER_MESSAGE, CLAUDE_MODEL, MAX_TOKENS } from "@/lib/anthropic";
import { buildChatContext, formatContextForPrompt } from "@/lib/chat-context";

const SYSTEM_PROMPT = `Eres un asistente de la plataforma de metodología de gestión estratégica de Ametller Origen.

Tu rol es ayudar a los usuarios con sus objetivos mensuales (Big Rocks) y tareas de alto rendimiento (TARs).

IMPORTANTE:
- Solo puedes responder sobre los Big Rocks y TARs del usuario que aparecen en el CONTEXTO
- No inventes información que no esté en el contexto
- Si te preguntan algo fuera del contexto de la plataforma, indica amablemente que solo puedes ayudar con temas relacionados con Big Rocks, TARs, personas clave y reuniones clave
- Responde en el mismo idioma que el usuario (español, catalán o inglés)
- Sé conciso y útil
- Puedes dar consejos sobre cómo mejorar los objetivos, priorizar tareas, y gestionar el tiempo

CONTEXTO DEL USUARIO:
{context}`;

interface ChatActionResult {
  success: boolean;
  error?: string;
  message?: {
    id: string;
    role: string;
    content: string;
    createdAt: Date;
  };
  conversationId?: string;
  creditsRemaining?: number;
}

interface CreditsResult {
  success: boolean;
  creditsUsed: number;
  creditsRemaining: number;
  error?: string;
}

interface ConversationsResult {
  success: boolean;
  conversations?: {
    id: string;
    title: string | null;
    createdAt: Date;
    updatedAt: Date;
    messageCount: number;
  }[];
  error?: string;
}

interface MessagesResult {
  success: boolean;
  messages?: {
    id: string;
    role: string;
    content: string;
    createdAt: Date;
  }[];
  error?: string;
}

/**
 * Check if credits should be reset (new day)
 */
function shouldResetCredits(lastResetAt: Date): boolean {
  const now = new Date();
  const lastReset = new Date(lastResetAt);

  // Reset if different UTC date
  return now.toISOString().slice(0, 10) !== lastReset.toISOString().slice(0, 10);
}

/**
 * Get or create user chat credits, resetting if new day
 */
async function getOrCreateCredits(userId: string) {
  let credits = await prisma.userChatCredits.findUnique({
    where: { userId },
  });

  if (!credits) {
    // Create new credits record
    credits = await prisma.userChatCredits.create({
      data: {
        userId,
        creditsUsed: 0,
        lastResetAt: new Date(),
      },
    });
  } else if (shouldResetCredits(credits.lastResetAt)) {
    // Reset credits for new day
    credits = await prisma.userChatCredits.update({
      where: { userId },
      data: {
        creditsUsed: 0,
        lastResetAt: new Date(),
      },
    });
  }

  return credits;
}

/**
 * Get remaining credits for the current user
 */
export async function getCreditsRemaining(): Promise<CreditsResult> {
  try {
    const user = await requireAuth();
    const credits = await getOrCreateCredits(user.id);

    return {
      success: true,
      creditsUsed: credits.creditsUsed,
      creditsRemaining: DAILY_CREDITS - credits.creditsUsed,
    };
  } catch (error) {
    console.error("Error getting credits:", error);
    return {
      success: false,
      creditsUsed: 0,
      creditsRemaining: 0,
      error: "Error al obtener créditos",
    };
  }
}

/**
 * Send a message to the AI and get a response
 */
export async function sendChatMessage(
  message: string,
  conversationId?: string | null
): Promise<ChatActionResult> {
  try {
    const user = await requireAuth();
    const userId = user.id;
    const userRole = (user as unknown as { role: UserRole }).role || UserRole.USER;

    // Check credits
    const credits = await getOrCreateCredits(userId);
    const creditsRemaining = DAILY_CREDITS - credits.creditsUsed;

    if (creditsRemaining < CREDITS_PER_MESSAGE) {
      return {
        success: false,
        error: "noCredits",
        creditsRemaining: 0,
      };
    }

    // Get or create conversation
    let conversation;
    if (conversationId) {
      conversation = await prisma.chatConversation.findFirst({
        where: {
          id: conversationId,
          userId,
        },
      });

      if (!conversation) {
        return {
          success: false,
          error: "Conversación no encontrada",
        };
      }
    } else {
      // Create new conversation
      conversation = await prisma.chatConversation.create({
        data: {
          userId,
          title: message.slice(0, 50) + (message.length > 50 ? "..." : ""),
        },
      });
    }

    // Save user message
    const userMessage = await prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        role: "user",
        content: message,
        creditsUsed: 0,
      },
    });

    // Build context for AI
    const context = await buildChatContext(userId, userRole);
    const contextStr = formatContextForPrompt(context);
    const systemPrompt = SYSTEM_PROMPT.replace("{context}", contextStr);

    // Get conversation history for context
    const previousMessages = await prisma.chatMessage.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "asc" },
      take: 20, // Limit history to last 20 messages
    });

    // Format messages for Anthropic
    const messagesForAI = previousMessages.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }));

    // Call Claude API
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages: messagesForAI,
    });

    // Extract response text
    const assistantContent = response.content[0];
    const assistantText = assistantContent.type === "text" ? assistantContent.text : "";

    // Save assistant message
    const assistantMessage = await prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        role: "assistant",
        content: assistantText,
        creditsUsed: CREDITS_PER_MESSAGE,
      },
    });

    // Update credits used
    await prisma.userChatCredits.update({
      where: { userId },
      data: {
        creditsUsed: credits.creditsUsed + CREDITS_PER_MESSAGE,
      },
    });

    // Update conversation timestamp
    await prisma.chatConversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    revalidatePath("/");

    return {
      success: true,
      message: {
        id: assistantMessage.id,
        role: assistantMessage.role,
        content: assistantMessage.content,
        createdAt: assistantMessage.createdAt,
      },
      conversationId: conversation.id,
      creditsRemaining: creditsRemaining - CREDITS_PER_MESSAGE,
    };
  } catch (error) {
    console.error("Error sending chat message:", error);
    return {
      success: false,
      error: "Error al enviar mensaje",
    };
  }
}

/**
 * Get all conversations for the current user
 */
export async function getConversations(): Promise<ConversationsResult> {
  try {
    const user = await requireAuth();

    const conversations = await prisma.chatConversation.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      include: {
        _count: {
          select: { messages: true },
        },
      },
    });

    return {
      success: true,
      conversations: conversations.map((conv) => ({
        id: conv.id,
        title: conv.title,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
        messageCount: conv._count.messages,
      })),
    };
  } catch (error) {
    console.error("Error getting conversations:", error);
    return {
      success: false,
      error: "Error al obtener conversaciones",
    };
  }
}

/**
 * Get messages for a specific conversation
 */
export async function getConversationMessages(
  conversationId: string
): Promise<MessagesResult> {
  try {
    const user = await requireAuth();

    // Verify conversation belongs to user
    const conversation = await prisma.chatConversation.findFirst({
      where: {
        id: conversationId,
        userId: user.id,
      },
    });

    if (!conversation) {
      return {
        success: false,
        error: "Conversación no encontrada",
      };
    }

    const messages = await prisma.chatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
    });

    return {
      success: true,
      messages: messages.map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        createdAt: msg.createdAt,
      })),
    };
  } catch (error) {
    console.error("Error getting messages:", error);
    return {
      success: false,
      error: "Error al obtener mensajes",
    };
  }
}

/**
 * Delete a conversation
 */
export async function deleteConversation(conversationId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireAuth();

    // Verify conversation belongs to user
    const conversation = await prisma.chatConversation.findFirst({
      where: {
        id: conversationId,
        userId: user.id,
      },
    });

    if (!conversation) {
      return {
        success: false,
        error: "Conversación no encontrada",
      };
    }

    await prisma.chatConversation.delete({
      where: { id: conversationId },
    });

    revalidatePath("/");

    return { success: true };
  } catch (error) {
    console.error("Error deleting conversation:", error);
    return {
      success: false,
      error: "Error al eliminar conversación",
    };
  }
}
