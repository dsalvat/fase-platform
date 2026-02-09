"use server";

import { revalidatePath } from "next/cache";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { anthropic, DAILY_CREDITS, CREDITS_PER_MESSAGE, CLAUDE_MODEL, MAX_TOKENS } from "@/lib/anthropic";
import { buildChatContext, formatContextForPrompt } from "@/lib/chat-context";
import { getSuperviseeChanges, type SuperviseeChangesGroup } from "@/lib/activity-log";

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
    messageType: string;
    content: string;
    createdAt: Date;
  }[];
  error?: string;
}

interface UnreadCountResult {
  success: boolean;
  count: number;
  error?: string;
}

interface SystemNotificationResult {
  success: boolean;
  hasNotification: boolean;
  conversationId?: string;
  message?: {
    id: string;
    role: string;
    messageType: string;
    content: string;
    createdAt: Date;
  };
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
        messageType: "USER",
        content: message,
        creditsUsed: 0,
        isRead: true, // User messages are already "read"
      },
    });

    // Build context for AI (pass company for per-company supervisor context)
    const context = await buildChatContext(userId, userRole, user.currentCompanyId);
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
        messageType: "ASSISTANT",
        content: assistantText,
        creditsUsed: CREDITS_PER_MESSAGE,
        isRead: false, // New messages are unread
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
        messageType: msg.messageType,
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

/**
 * Get count of unread messages for the current user
 */
export async function getUnreadCount(): Promise<UnreadCountResult> {
  try {
    const user = await requireAuth();

    // Count unread assistant messages across all conversations
    const count = await prisma.chatMessage.count({
      where: {
        conversation: {
          userId: user.id,
        },
        role: "assistant",
        isRead: false,
      },
    });

    return {
      success: true,
      count,
    };
  } catch (error) {
    console.error("Error getting unread count:", error);
    return {
      success: false,
      count: 0,
      error: "Error al obtener mensajes no leídos",
    };
  }
}

/**
 * Mark all messages in a conversation as read
 */
export async function markMessagesAsRead(conversationId: string): Promise<{ success: boolean; error?: string }> {
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

    // Mark all assistant messages as read
    await prisma.chatMessage.updateMany({
      where: {
        conversationId,
        role: "assistant",
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error marking messages as read:", error);
    return {
      success: false,
      error: "Error al marcar mensajes como leídos",
    };
  }
}

/**
 * Update user's lastVisitedAt timestamp
 */
export async function updateLastVisitedAt(): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireAuth();

    await prisma.user.update({
      where: { id: user.id },
      data: { lastVisitedAt: new Date() },
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating lastVisitedAt:", error);
    return {
      success: false,
      error: "Error al actualizar última visita",
    };
  }
}

/**
 * Format supervisee changes into a notification message
 */
function formatSuperviseeNotification(changesGroups: SuperviseeChangesGroup[]): string {
  const actionEmojis: Record<string, string> = {
    CREATE: "🆕",
    UPDATE: "✏️",
    DELETE: "🗑️",
  };

  const entityLabels: Record<string, string> = {
    BIG_ROCK: "Big Rock",
    TAR: "TAR",
    ACTIVITY: "actividad",
    KEY_PERSON: "persona clave",
    KEY_MEETING: "reunión clave",
  };

  const actionLabels: Record<string, string> = {
    CREATE: "ha creado",
    UPDATE: "ha actualizado",
    DELETE: "ha eliminado",
  };

  let message = "📋 **Novedades de tus supervisados:**\n\n";

  for (const group of changesGroups) {
    message += `**${group.superviseeName}** ha realizado ${group.changes.length} cambio${group.changes.length > 1 ? "s" : ""}:\n`;

    for (const change of group.changes.slice(0, 5)) { // Limit to 5 changes per person
      const emoji = actionEmojis[change.action] || "📝";
      const actionLabel = actionLabels[change.action] || "ha modificado";
      const entityLabel = entityLabels[change.entityType] || "elemento";
      const title = change.entityTitle || "sin título";

      message += `- ${emoji} ${actionLabel} ${entityLabel}: "${title}" [Ver →](${change.link})\n`;
    }

    if (group.changes.length > 5) {
      message += `- ... y ${group.changes.length - 5} cambio${group.changes.length - 5 > 1 ? "s" : ""} más\n`;
    }

    message += "\n";
  }

  return message.trim();
}

/**
 * Generate a system notification for supervisor with supervisee changes
 * This does NOT consume credits
 */
export async function generateSystemNotification(): Promise<SystemNotificationResult> {
  try {
    const user = await requireAuth();
    const userId = user.id;

    // Get full user data including role and lastVisitedAt
    const userData = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        lastVisitedAt: true,
      },
    });

    if (!userData) {
      return {
        success: false,
        hasNotification: false,
        error: "Usuario no encontrado",
      };
    }

    // Only supervisors and above can see supervisee changes
    if (userData.role !== "SUPERVISOR" && userData.role !== "ADMIN" && userData.role !== "SUPERADMIN") {
      // Update lastVisitedAt for non-supervisors too
      await prisma.user.update({
        where: { id: userId },
        data: { lastVisitedAt: new Date() },
      });

      return {
        success: true,
        hasNotification: false,
      };
    }

    // Get changes since last visit
    const changesGroups = await getSuperviseeChanges(userId, userData.lastVisitedAt, user.currentCompanyId);

    // Update lastVisitedAt
    await prisma.user.update({
      where: { id: userId },
      data: { lastVisitedAt: new Date() },
    });

    if (changesGroups.length === 0) {
      return {
        success: true,
        hasNotification: false,
      };
    }

    // Format notification message
    const notificationContent = formatSuperviseeNotification(changesGroups);

    // Create or get a "notifications" conversation
    let conversation = await prisma.chatConversation.findFirst({
      where: {
        userId,
        title: "📋 Notificaciones",
      },
      orderBy: { updatedAt: "desc" },
    });

    if (!conversation) {
      conversation = await prisma.chatConversation.create({
        data: {
          userId,
          title: "📋 Notificaciones",
        },
      });
    }

    // Create system message (no credits consumed)
    const systemMessage = await prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        role: "assistant",
        messageType: "SYSTEM",
        content: notificationContent,
        creditsUsed: 0,
        isRead: false,
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
      hasNotification: true,
      conversationId: conversation.id,
      message: {
        id: systemMessage.id,
        role: systemMessage.role,
        messageType: systemMessage.messageType,
        content: systemMessage.content,
        createdAt: systemMessage.createdAt,
      },
    };
  } catch (error) {
    console.error("Error generating system notification:", error);
    return {
      success: false,
      hasNotification: false,
      error: "Error al generar notificación",
    };
  }
}
