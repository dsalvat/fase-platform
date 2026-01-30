"use client";

import { useState, useTransition } from "react";
import { toggleKeyMeetingCompletion } from "@/app/actions/key-meetings";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface KeyMeetingCompletionToggleProps {
  keyMeetingId: string;
  completed: boolean;
  showOutcomeInput?: boolean;
}

/**
 * Client Component for toggling Key Meeting completion status
 * Optionally allows entering outcome when marking as completed
 */
export function KeyMeetingCompletionToggle({
  keyMeetingId,
  completed: initialCompleted,
  showOutcomeInput = true,
}: KeyMeetingCompletionToggleProps) {
  const [completed, setCompleted] = useState(initialCompleted);
  const [showOutcome, setShowOutcome] = useState(false);
  const [outcome, setOutcome] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    if (!completed && showOutcomeInput) {
      // Show outcome input when marking as completed
      setShowOutcome(true);
    } else {
      // Toggle directly when unchecking or not showing outcome input
      performToggle(!completed);
    }
  };

  const performToggle = (newCompleted: boolean, outcomeText?: string) => {
    startTransition(async () => {
      try {
        const result = await toggleKeyMeetingCompletion(
          keyMeetingId,
          newCompleted,
          outcomeText
        );

        if (result.success) {
          setCompleted(newCompleted);
          setShowOutcome(false);
          setOutcome("");
          setError(null);
        } else {
          setError(result.error || "Error al actualizar el estado");
        }
      } catch {
        setError("Error inesperado al actualizar el estado");
      }
    });
  };

  const handleConfirmCompletion = () => {
    performToggle(true, outcome || undefined);
  };

  const handleCancel = () => {
    setShowOutcome(false);
    setOutcome("");
  };

  if (showOutcome) {
    return (
      <div className="space-y-3 p-4 border rounded-lg bg-gray-50">
        <h4 className="font-medium text-sm">Marcar como completada</h4>
        <div className="space-y-2">
          <label
            htmlFor="outcome"
            className="text-sm text-muted-foreground"
          >
            Resultado de la reunion (opcional)
          </label>
          <textarea
            id="outcome"
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
            placeholder="Describe los resultados, decisiones o acuerdos..."
            rows={3}
            maxLength={2000}
            disabled={isPending}
            className="flex w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        {error && (
          <div className="text-sm text-red-600">{error}</div>
        )}

        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleConfirmCompletion}
            disabled={isPending}
          >
            {isPending ? "Guardando..." : "Confirmar"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCancel}
            disabled={isPending}
          >
            Cancelar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant={completed ? "default" : "outline"}
        size="sm"
        onClick={handleToggle}
        disabled={isPending}
        className={cn(
          completed && "bg-green-600 hover:bg-green-700"
        )}
      >
        {completed ? (
          <>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Completada
          </>
        ) : (
          <>
            <Circle className="h-4 w-4 mr-2" />
            Marcar completada
          </>
        )}
      </Button>

      {error && (
        <span className="text-sm text-red-600">{error}</span>
      )}
    </div>
  );
}
