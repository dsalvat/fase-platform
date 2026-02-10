import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { anthropic, CLAUDE_MODEL, AI_EVALUATION_MAX_TOKENS } from "@/lib/anthropic";
import { getUserAIContext } from "@/lib/ai-context";

const EVALUATION_SYSTEM_PROMPT = `Eres un evaluador experto en planificacion estrategica y metodologia FASE (objetivos mensuales de alto rendimiento).

Tu tarea es evaluar la calidad de un "Big Rock" (objetivo mensual) y proporcionar feedback constructivo.

Evalua segun estos criterios:
1. **Claridad**: El titulo y descripcion son claros y comprensibles?
2. **Especificidad**: El objetivo es concreto y no ambiguo?
3. **Medibilidad**: El indicador (KPI) permite medir el exito objetivamente?
4. **Alcanzabilidad**: Es realista completarlo en un mes con el numero de TARs planificadas?
5. **Relevancia**: Parece un objetivo de alto impacto estrategico?

IMPORTANTE:
- Responde EXCLUSIVAMENTE con un JSON valido, sin markdown ni texto adicional.
- El JSON debe tener exactamente esta estructura:
{
  "score": <numero entero de 0 a 100>,
  "observations": "<texto con observaciones sobre la calidad del objetivo>",
  "recommendations": "<texto con recomendaciones concretas de mejora>",
  "risks": "<texto con riesgos o alertas identificados>"
}

- El score debe reflejar la calidad global del objetivo (0=muy pobre, 100=excelente)
- Las observaciones deben ser constructivas y especificas
- Las recomendaciones deben ser accionables
- Los riesgos deben identificar posibles obstaculos o problemas
- Responde siempre en espanol
- Se conciso pero completo (cada campo entre 1-3 frases)`;

interface AIEvaluationResult {
  score: number;
  observations: string;
  recommendations: string;
  risks: string;
}

function parseEvaluationResponse(text: string): AIEvaluationResult | null {
  try {
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);

    if (typeof parsed.score !== "number" || parsed.score < 0 || parsed.score > 100) {
      return null;
    }

    return {
      score: Math.round(parsed.score),
      observations: String(parsed.observations || ""),
      recommendations: String(parsed.recommendations || ""),
      risks: String(parsed.risks || ""),
    };
  } catch {
    return null;
  }
}

/**
 * Evaluates a Big Rock using Claude AI and saves the results.
 * Called after confirming a Big Rock (CREADO -> CONFIRMADO).
 */
export async function evaluateBigRock(bigRockId: string): Promise<void> {
  const bigRock = await prisma.bigRock.findUnique({
    where: { id: bigRockId },
    include: {
      tars: { select: { description: true, status: true } },
      keyMeetings: { select: { title: true, objective: true, date: true } },
      keyPeople: { include: { user: { select: { name: true } } } },
    },
  });

  if (!bigRock) {
    console.error(`AI evaluation: Big Rock ${bigRockId} not found`);
    return;
  }

  const tarsText =
    bigRock.tars.length > 0
      ? bigRock.tars.map((t, i) => `${i + 1}. ${t.description} (${t.status})`).join("\n")
      : "Ninguna definida aun";

  const meetingsText =
    bigRock.keyMeetings.length > 0
      ? bigRock.keyMeetings
          .map(
            (m) =>
              `- ${m.title} (${m.date.toISOString().slice(0, 10)}): ${m.objective || "Sin objetivo definido"}`
          )
          .join("\n")
      : "Ninguna";

  const peopleText =
    bigRock.keyPeople.length > 0
      ? bigRock.keyPeople.map((p) => p.user.name || "Sin nombre").join(", ")
      : "Ninguna";

  // Fetch user's personal AI context
  const userContext = bigRock.companyId
    ? await getUserAIContext(bigRock.userId, bigRock.companyId)
    : null;
  const contextBlock = userContext ? `\n${userContext}\n` : "";

  const userMessage = `Evalua el siguiente Big Rock:
${contextBlock}
**Titulo**: ${bigRock.title}
**Descripcion**: ${bigRock.description}
**Indicador de exito (KPI)**: ${bigRock.indicator}
**Numero de TARs planificadas**: ${bigRock.numTars}
**Mes de ejecucion**: ${bigRock.month}
**TARs definidas**:
${tarsText}
**Reuniones clave**:
${meetingsText}
**Personas clave**: ${peopleText}`;

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: AI_EVALUATION_MAX_TOKENS,
    system: EVALUATION_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    console.error("AI evaluation: unexpected response type", content.type);
    return;
  }

  const result = parseEvaluationResponse(content.text);
  if (!result) {
    console.error("AI evaluation: failed to parse response", content.text);
    return;
  }

  await prisma.bigRock.update({
    where: { id: bigRockId },
    data: {
      aiScore: result.score,
      aiObservations: result.observations,
      aiRecommendations: result.recommendations,
      aiRisks: result.risks,
    },
  });

  revalidatePath(`/big-rocks/${bigRockId}`);
}

const MONTH_EVALUATION_SYSTEM_PROMPT = `Eres un evaluador experto en planificacion estrategica y metodologia FASE (objetivos mensuales de alto rendimiento).

Tu tarea es evaluar la calidad GLOBAL de la planificacion mensual de un usuario, considerando todos sus Big Rocks (objetivos) en conjunto.

Evalua segun estos criterios:
1. **Coherencia**: Los objetivos del mes son coherentes entre si y forman un plan estrategico solido?
2. **Equilibrio**: Hay un balance adecuado entre los distintos objetivos (no todo en una sola area)?
3. **Ambicion**: El nivel de ambicion es adecuado para un mes (ni demasiado ni demasiado poco)?
4. **Cobertura**: Los indicadores de exito cubren aspectos clave del rendimiento?
5. **Viabilidad**: Es realista completar todos los objetivos en el mes con las TARs planificadas?

IMPORTANTE:
- Responde EXCLUSIVAMENTE con un JSON valido, sin markdown ni texto adicional.
- El JSON debe tener exactamente esta estructura:
{
  "score": <numero entero de 0 a 100>,
  "observations": "<texto con observaciones sobre la calidad global de la planificacion>",
  "recommendations": "<texto con recomendaciones concretas de mejora>",
  "risks": "<texto con riesgos o alertas identificados>"
}

- El score debe reflejar la calidad global de la planificacion mensual (0=muy pobre, 100=excelente)
- Las observaciones deben valorar el conjunto, no repetir lo dicho en evaluaciones individuales
- Las recomendaciones deben ser accionables a nivel de planificacion mensual
- Los riesgos deben identificar posibles conflictos entre objetivos u obstaculos globales
- Responde siempre en espanol
- Se conciso pero completo (cada campo entre 2-4 frases)`;

/**
 * Evaluates the entire month planning using Claude AI and saves results on OpenMonth.
 * Summarizes all Big Rocks for the given user/month.
 */
export async function evaluateMonthPlanning(
  userId: string,
  month: string,
  companyId: string
): Promise<void> {
  const bigRocks = await prisma.bigRock.findMany({
    where: { userId, month },
    include: {
      tars: { select: { description: true, status: true } },
      keyMeetings: { select: { title: true, objective: true, date: true } },
      keyPeople: { include: { user: { select: { name: true } } } },
    },
    orderBy: { createdAt: "asc" },
  });

  if (bigRocks.length === 0) {
    console.error(`AI month evaluation: no Big Rocks for user ${userId} month ${month}`);
    return;
  }

  const bigRocksText = bigRocks
    .map((br, i) => {
      const tarsText =
        br.tars.length > 0
          ? br.tars.map((t, j) => `  ${j + 1}. ${t.description} (${t.status})`).join("\n")
          : "  Ninguna definida";

      const meetingsCount = br.keyMeetings.length;
      const peopleText =
        br.keyPeople.length > 0
          ? br.keyPeople.map((p) => p.user.name || "Sin nombre").join(", ")
          : "Ninguna";

      return `### Big Rock ${i + 1}: ${br.title}
- **Descripcion**: ${br.description}
- **Indicador (KPI)**: ${br.indicator}
- **TARs planificadas**: ${br.numTars}
- **Reuniones clave**: ${meetingsCount}
- **Personas clave**: ${peopleText}
- **Score IA individual**: ${br.aiScore !== null ? `${br.aiScore}/100` : "No evaluado"}
- **TARs definidas**:
${tarsText}`;
    })
    .join("\n\n");

  // Fetch user's personal AI context
  const userContext = await getUserAIContext(userId, companyId);
  const contextBlock = userContext ? `\n${userContext}\n` : "";

  const userMessage = `Evalua la planificacion mensual global del usuario para el mes ${month}.
${contextBlock}
El usuario tiene ${bigRocks.length} Big Rocks este mes:

${bigRocksText}`;

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: AI_EVALUATION_MAX_TOKENS,
    system: MONTH_EVALUATION_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    console.error("AI month evaluation: unexpected response type", content.type);
    return;
  }

  const result = parseEvaluationResponse(content.text);
  if (!result) {
    console.error("AI month evaluation: failed to parse response", content.text);
    return;
  }

  // Upsert the OpenMonth record with AI evaluation
  await prisma.openMonth.upsert({
    where: {
      month_userId: { month, userId },
    },
    update: {
      aiScore: result.score,
      aiObservations: result.observations,
      aiRecommendations: result.recommendations,
      aiRisks: result.risks,
    },
    create: {
      month,
      userId,
      aiScore: result.score,
      aiObservations: result.observations,
      aiRecommendations: result.recommendations,
      aiRisks: result.risks,
    },
  });

  revalidatePath("/supervisor");
}
