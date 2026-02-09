import { prisma } from "@/lib/db";
import { anthropic, CLAUDE_MODEL, AI_EVALUATION_MAX_TOKENS } from "@/lib/anthropic";
import { FaseCategory } from "@prisma/client";
import { getPreviousMonth } from "@/lib/month-helpers";

export interface BigRockProposal {
  title: string;
  description: string;
  indicator: string;
  numTars: number;
  category: FaseCategory | null;
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
  "category": "<FOCUS | ATENCION | SISTEMAS | ENERGIA | null>"
}

- Genera entre 3 y 5 Big Rocks variados
- Intenta cubrir al menos 2 categorias FASE diferentes
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
      }));
  } catch {
    return [];
  }
}

/**
 * Generates Big Rock proposals using Claude AI based on user's history.
 */
export async function generateBigRockProposals(
  userId: string,
  month: string
): Promise<BigRockProposal[]> {
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

  const userMessage = `Genera propuestas de Big Rocks para el mes ${month}.

Historial de Big Rocks del usuario (ultimos 3 meses):
${historyText}

Basandote en este historial, propone entre 3 y 5 Big Rocks nuevos y relevantes para el proximo mes.`;

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: AI_EVALUATION_MAX_TOKENS,
    system: GENERATION_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
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
