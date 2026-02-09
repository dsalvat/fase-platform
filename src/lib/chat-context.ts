import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";

interface BigRockContext {
  id: string;
  title: string;
  description: string;
  indicator: string;
  status: string;
  month: string;
  tars: {
    description: string;
    status: string;
    progress: number;
  }[];
  keyPeople: {
    name: string | null;
    email: string;
    role: string | null;
  }[];
  keyMeetings: {
    title: string;
    date: Date;
    completed: boolean;
    objective: string | null;
  }[];
}

interface UserContextData {
  userName: string;
  bigRocks: BigRockContext[];
}

interface SupervisedUserContext extends UserContextData {
  userId: string;
  email: string;
}

export interface ChatContextResult {
  userContext: UserContextData;
  supervisedContext: SupervisedUserContext[];
}

/**
 * Build context for the AI chat from user's Big Rocks and supervised users' Big Rocks
 */
export async function buildChatContext(
  userId: string,
  userRole: UserRole,
  companyId?: string | null
): Promise<ChatContextResult> {
  // Get user's own Big Rocks (last 3 months for context)
  const threeMonthsAgo = getMonthOffset(-3);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });

  const userBigRocks = await prisma.bigRock.findMany({
    where: {
      userId,
      month: { gte: threeMonthsAgo },
    },
    include: {
      tars: {
        select: {
          description: true,
          status: true,
          progress: true,
        },
      },
      keyPeople: {
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
      keyMeetings: {
        select: {
          title: true,
          date: true,
          completed: true,
          objective: true,
        },
      },
    },
    orderBy: { month: "desc" },
  });

  const userContext: UserContextData = {
    userName: user?.name || user?.email || "Usuario",
    bigRocks: userBigRocks.map(formatBigRock),
  };

  // Get supervised users' Big Rocks if supervisor/admin
  const supervisedContext: SupervisedUserContext[] = [];

  if (userRole === UserRole.SUPERVISOR || userRole === UserRole.ADMIN || userRole === UserRole.SUPERADMIN) {
    // Get supervisees via per-company relationship
    const superviseeUcs = companyId
      ? await prisma.userCompany.findMany({
          where: { supervisorId: userId, companyId },
          select: { userId: true },
        })
      : [];
    const superviseeIds = superviseeUcs.map((uc) => uc.userId);

    const supervisedUsers = await prisma.user.findMany({
      where: { id: { in: superviseeIds } },
      select: {
        id: true,
        name: true,
        email: true,
        bigRocks: {
          where: {
            month: { gte: threeMonthsAgo },
          },
          include: {
            tars: {
              select: {
                description: true,
                status: true,
                progress: true,
              },
            },
            keyPeople: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
            },
            keyMeetings: {
              select: {
                title: true,
                date: true,
                completed: true,
                objective: true,
              },
            },
          },
          orderBy: { month: "desc" },
        },
      },
    });

    for (const supervisedUser of supervisedUsers) {
      supervisedContext.push({
        userId: supervisedUser.id,
        userName: supervisedUser.name || supervisedUser.email,
        email: supervisedUser.email,
        bigRocks: supervisedUser.bigRocks.map(formatBigRock),
      });
    }
  }

  return { userContext, supervisedContext };
}

function formatBigRock(bigRock: {
  id: string;
  title: string;
  description: string;
  indicator: string;
  status: string;
  month: string;
  tars: { description: string; status: string; progress: number }[];
  keyPeople: { role: string | null; user: { name: string | null; email: string } }[];
  keyMeetings: { title: string; date: Date; completed: boolean; objective: string | null }[];
}): BigRockContext {
  return {
    id: bigRock.id,
    title: bigRock.title,
    description: bigRock.description,
    indicator: bigRock.indicator,
    status: bigRock.status,
    month: bigRock.month,
    tars: bigRock.tars,
    keyPeople: bigRock.keyPeople.map((kp) => ({
      name: kp.user.name,
      email: kp.user.email,
      role: kp.role,
    })),
    keyMeetings: bigRock.keyMeetings,
  };
}

function getMonthOffset(offset: number): string {
  const date = new Date();
  date.setMonth(date.getMonth() + offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Format context data into a string for the AI system prompt
 */
export function formatContextForPrompt(context: ChatContextResult): string {
  let contextStr = "";

  // User's own Big Rocks
  contextStr += `## Tus Big Rocks (Objetivos)\n\n`;
  if (context.userContext.bigRocks.length === 0) {
    contextStr += "No tienes Big Rocks creados actualmente.\n\n";
  } else {
    for (const bigRock of context.userContext.bigRocks) {
      contextStr += formatBigRockToString(bigRock);
    }
  }

  // Supervised users' Big Rocks
  if (context.supervisedContext.length > 0) {
    contextStr += `\n## Big Rocks de tus Supervisados\n\n`;
    for (const supervised of context.supervisedContext) {
      contextStr += `### ${supervised.userName} (${supervised.email})\n\n`;
      if (supervised.bigRocks.length === 0) {
        contextStr += "Sin Big Rocks creados.\n\n";
      } else {
        for (const bigRock of supervised.bigRocks) {
          contextStr += formatBigRockToString(bigRock);
        }
      }
    }
  }

  return contextStr;
}

function formatBigRockToString(bigRock: BigRockContext): string {
  let str = `### ${bigRock.title} (${bigRock.month})\n`;
  str += `- **Estado**: ${translateStatus(bigRock.status)}\n`;
  str += `- **Descripción**: ${bigRock.description}\n`;
  str += `- **Indicador de éxito**: ${bigRock.indicator}\n`;

  if (bigRock.tars.length > 0) {
    str += `- **TARs (Tareas de Alto Rendimiento)**:\n`;
    for (const tar of bigRock.tars) {
      str += `  - ${tar.description} (${translateTarStatus(tar.status)}, ${tar.progress}% completado)\n`;
    }
  }

  if (bigRock.keyPeople.length > 0) {
    str += `- **Personas Clave**:\n`;
    for (const person of bigRock.keyPeople) {
      str += `  - ${person.name || person.email}${person.role ? ` (${person.role})` : ""}\n`;
    }
  }

  if (bigRock.keyMeetings.length > 0) {
    str += `- **Reuniones Clave**:\n`;
    for (const meeting of bigRock.keyMeetings) {
      const dateStr = meeting.date.toLocaleDateString("es-ES");
      str += `  - ${meeting.title} (${dateStr}) - ${meeting.completed ? "Completada" : "Pendiente"}\n`;
    }
  }

  str += "\n";
  return str;
}

function translateStatus(status: string): string {
  const translations: Record<string, string> = {
    CREADO: "Creado",
    CONFIRMADO: "Confirmado",
    FEEDBACK_RECIBIDO: "Feedback recibido",
    EN_PROGRESO: "En progreso",
    FINALIZADO: "Finalizado",
  };
  return translations[status] || status;
}

function translateTarStatus(status: string): string {
  const translations: Record<string, string> = {
    PENDIENTE: "Pendiente",
    EN_PROGRESO: "En progreso",
    COMPLETADA: "Completada",
  };
  return translations[status] || status;
}
