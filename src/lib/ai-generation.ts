import { prisma } from "@/lib/db";
import { anthropic, CLAUDE_MODEL, AI_GENERATION_MAX_TOKENS } from "@/lib/anthropic";
import { FaseCategory } from "@prisma/client";
import { getPreviousMonth } from "@/lib/month-helpers";
import { getUserAIContext } from "@/lib/ai-context";

export interface BigRockProposalMeeting {
  title: string;
  objective: string;
  expectedDecision: string | null;
}

export interface BigRockProposal {
  title: string;
  description: string;
  indicator: string;
  numTars: number;
  category: FaseCategory | null;
  tars: { description: string }[];
  meetings: BigRockProposalMeeting[];
}

const GENERATION_SYSTEM_PROMPT = `Eres un experto en planificacion estrategica y metodologia FASE (objetivos mensuales de alto rendimiento).

Tu tarea es proponer Big Rocks (objetivos mensuales) para un usuario, basandote en su historial de meses anteriores.

Cada Big Rock debe ser:
- **Concreto y accionable**: Un objetivo claro que se pueda completar en un mes
- **Medible**: Con un indicador de exito (KPI) cuantificable
- **Estrategico**: De alto impacto para el rendimiento profesional
- **Diversificado**: Cubrir distintas areas (no repetir temas del mes anterior)

Las categorias FASE disponibles son:
- FOCUS: Objetivos que requieren concentracion profunda y foco
- ATENCION: Objetivos de gestion de relaciones y atencion a personas
- SISTEMAS: Objetivos de mejora de procesos y sistemas
- ENERGIA: Objetivos de bienestar, energia personal y habitos

IMPORTANTE:
- Responde EXCLUSIVAMENTE con un JSON valido, sin markdown ni texto adicional.
- El JSON debe ser un array con 3 a 5 objetos, cada uno con esta estructura:
{
  "title": "<titulo del objetivo, 3-100 caracteres>",
  "description": "<descripcion detallada, 10-500 caracteres>",
  "indicator": "<indicador de exito medible, 5-200 caracteres>",
  "numTars": <numero de tareas necesarias, entre 2 y 8>,
  "category": "<FOCUS | ATENCION | SISTEMAS | ENERGIA | null>",
  "tars": [
    { "description": "<descripcion concreta de la tarea, 5-200 caracteres>" }
  ],
  "meetings": [
    { "title": "<titulo de la reunion>", "objective": "<objetivo de la reunion>", "expectedDecision": "<decision esperada o null>" }
  ]
}

- Genera entre 3 y 5 Big Rocks variados
- Intenta cubrir al menos 2 categorias FASE diferentes
- Para cada Big Rock, genera exactamente "numTars" TARs (Tareas de Alto Rendimiento) con descripciones concretas y accionables
- Para cada Big Rock, genera entre 0 y 3 Reuniones Clave relevantes (reuniones necesarias para avanzar en el objetivo)
- Basa las propuestas en el contexto del usuario y sus objetivos anteriores
- Si el usuario ha tenido exito en un area, sugiere avanzar al siguiente nivel
- Si ha tenido dificultades, sugiere objetivos mas alcanzables en esa area
- Responde siempre en espanol`;

const VALID_CATEGORIES = new Set(["FOCUS", "ATENCION", "SISTEMAS", "ENERGIA"]);

function parseProposalsResponse(text: string): BigRockProposal[] {
  try {
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);

    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(
        (p: Record<string, unknown>) =>
          typeof p.title === "string" &&
          p.title.length >= 3 &&
          p.title.length <= 100 &&
          typeof p.description === "string" &&
          p.description.length >= 10 &&
          typeof p.indicator === "string" &&
          p.indicator.length >= 5 &&
          typeof p.numTars === "number" &&
          p.numTars >= 1 &&
          p.numTars <= 20
      )
      .map((p: Record<string, unknown>) => ({
        title: String(p.title).slice(0, 100),
        description: String(p.description).slice(0, 2000),
        indicator: String(p.indicator).slice(0, 500),
        numTars: Math.min(20, Math.max(1, Math.round(p.numTars as number))),
        category:
          typeof p.category === "string" && VALID_CATEGORIES.has(p.category)
            ? (p.category as FaseCategory)
            : null,
        tars: Array.isArray(p.tars)
          ? (p.tars as Record<string, unknown>[])
              .filter((t) => typeof t.description === "string" && t.description.length >= 5)
              .map((t) => ({ description: String(t.description).slice(0, 2000) }))
          : [],
        meetings: Array.isArray(p.meetings)
          ? (p.meetings as Record<string, unknown>[])
              .filter((m) => typeof m.title === "string" && m.title.length >= 3)
              .map((m) => ({
                title: String(m.title).slice(0, 200),
                objective: typeof m.objective === "string" ? String(m.objective).slice(0, 500) : "",
                expectedDecision: typeof m.expectedDecision === "string" ? String(m.expectedDecision).slice(0, 500) : null,
              }))
          : [],
      }));
  } catch {
    return [];
  }
}

/**
 * Builds the prompt messages for generating Big Rock proposals.
 * Exported so it can be reused for token estimation.
 */
export async function buildGenerationMessages(
  userId: string,
  month: string,
  companyId: string
): Promise<{ system: string; userMessage: string }> {
  // Get previous 3 months
  let prevMonth = month;
  const previousMonths: string[] = [];
  for (let i = 0; i < 3; i++) {
    prevMonth = getPreviousMonth(prevMonth);
    previousMonths.push(prevMonth);
  }

  const previousBigRocks = await prisma.bigRock.findMany({
    where: {
      userId,
      month: { in: previousMonths },
    },
    select: {
      title: true,
      description: true,
      indicator: true,
      numTars: true,
      month: true,
      status: true,
      category: true,
      aiScore: true,
    },
    orderBy: { month: "desc" },
  });

  // Fetch user's personal AI context
  const userContext = await getUserAIContext(userId, companyId);

  let historyText: string;
  if (previousBigRocks.length > 0) {
    historyText = previousBigRocks
      .map(
        (br) =>
          `- [${br.month}] "${br.title}" (${br.status}, Score IA: ${br.aiScore ?? "N/A"}, Categoria: ${br.category || "Sin categoria"})\n  Indicador: ${br.indicator}`
      )
      .join("\n");
  } else {
    historyText = "No hay historial previo. Es el primer mes del usuario.";
  }

  const contextBlock = userContext
    ? `\n${userContext}\n`
    : "";

  const userMessage = `Genera propuestas de Big Rocks para el mes ${month}.
${contextBlock}
Historial de Big Rocks del usuario (ultimos 3 meses):
${historyText}

Basandote en este contexto e historial, propone entre 3 y 5 Big Rocks nuevos y relevantes para el proximo mes.`;

  return { system: GENERATION_SYSTEM_PROMPT, userMessage };
}

/**
 * Generates Big Rock proposals using Claude AI based on user's history.
 */
export async function generateBigRockProposals(
  userId: string,
  month: string,
  companyId: string
): Promise<BigRockProposal[]> {
  const messages = await buildGenerationMessages(userId, month, companyId);

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: AI_GENERATION_MAX_TOKENS,
    system: messages.system,
    messages: [{ role: "user", content: messages.userMessage }],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    console.error("AI generation: unexpected response type", content.type);
    return [];
  }

  const proposals = parseProposalsResponse(content.text);
  if (proposals.length === 0) {
    console.error("AI generation: failed to parse proposals", content.text);
  }

  return proposals;
}
