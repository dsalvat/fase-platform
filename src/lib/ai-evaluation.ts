import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { anthropic, CLAUDE_MODEL, AI_EVALUATION_MAX_TOKENS } from "@/lib/anthropic";

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

  const userMessage = `Evalua el siguiente Big Rock:

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
