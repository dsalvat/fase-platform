"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { generateAIEvaluation } from "@/app/actions/big-rocks";
import { Button } from "@/components/ui/button";
import { Bot, Loader2, Star, AlertTriangle, Lightbulb, Eye } from "lucide-react";

interface AIFeedbackSectionProps {
  bigRockId: string;
  aiScore: number | null;
  aiObservations: string | null;
  aiRecommendations: string | null;
  aiRisks: string | null;
}

export function AIFeedbackSection({
  bigRockId,
  aiScore,
  aiObservations,
  aiRecommendations,
  aiRisks,
}: AIFeedbackSectionProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const hasAIFeedback = aiObservations || aiRecommendations || aiRisks;

  const handleGenerate = () => {
    setError(null);
    startTransition(async () => {
      const result = await generateAIEvaluation(bigRockId);
      if (result.success) {
        router.refresh();
      } else {
        setError(result.error || "Error al generar evaluacion IA");
      }
    });
  };

  // No AI feedback — show generate button
  if (!hasAIFeedback) {
    return (
      <div className="pt-4 border-t">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
            <Bot className="h-4 w-4" />
            Feedback de IA
          </h4>
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerate}
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <Bot className="h-4 w-4 mr-1" />
                Generar Feedback IA
              </>
            )}
          </Button>
        </div>
        {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
      </div>
    );
  }

  // Has AI feedback — display it
  const scoreColor =
    aiScore !== null
      ? aiScore >= 80
        ? "text-green-600"
        : aiScore >= 60
          ? "text-yellow-600"
          : "text-red-600"
      : "";

  return (
    <div className="pt-4 border-t space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
          <Bot className="h-4 w-4" />
          Feedback de IA
        </h4>
        {aiScore !== null && (
          <span className={`text-sm font-semibold ${scoreColor}`}>
            <Star className="h-3.5 w-3.5 inline mr-1" />
            {aiScore}/100
          </span>
        )}
      </div>

      {aiObservations && (
        <div>
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1">
            <Eye className="h-3 w-3" />
            Observaciones
          </p>
          <p className="text-sm text-foreground">{aiObservations}</p>
        </div>
      )}

      {aiRecommendations && (
        <div>
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1">
            <Lightbulb className="h-3 w-3" />
            Recomendaciones
          </p>
          <p className="text-sm text-foreground">{aiRecommendations}</p>
        </div>
      )}

      {aiRisks && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <p className="text-xs font-medium text-red-800 dark:text-red-300 flex items-center gap-1 mb-1">
            <AlertTriangle className="h-3 w-3" />
            Riesgos
          </p>
          <p className="text-sm text-red-700 dark:text-red-400">{aiRisks}</p>
        </div>
      )}
    </div>
  );
}
