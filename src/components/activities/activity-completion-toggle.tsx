"use client";

import { useState, useTransition } from "react";
import { toggleActivityCompletion } from "@/app/actions/activities";
import { cn } from "@/lib/utils";
import { Check, Circle } from "lucide-react";

interface ActivityCompletionToggleProps {
  activityId: string;
  initialCompleted: boolean;
  disabled?: boolean;
}

/**
 * Toggle button for Activity completion status
 */
export function ActivityCompletionToggle({
  activityId,
  initialCompleted,
  disabled = false,
}: ActivityCompletionToggleProps) {
  const [completed, setCompleted] = useState(initialCompleted);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    const newCompleted = !completed;

    startTransition(async () => {
      setError(null);
      const result = await toggleActivityCompletion(activityId, newCompleted);

      if (result.success) {
        setCompleted(newCompleted);
      } else {
        setError(result.error || "Error al actualizar");
      }
    });
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled || isPending}
        className={cn(
          "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all",
          completed
            ? "bg-green-500 border-green-500 text-white"
            : "bg-white border-gray-300 text-gray-400 hover:border-green-400",
          isPending && "opacity-50 cursor-not-allowed",
          disabled && "cursor-not-allowed"
        )}
        title={completed ? "Marcar como pendiente" : "Marcar como completada"}
      >
        {completed ? (
          <Check className="h-5 w-5" />
        ) : (
          <Circle className="h-5 w-5" />
        )}
      </button>

      {error && (
        <p className="absolute top-full left-0 mt-1 text-xs text-red-500 whitespace-nowrap">
          {error}
        </p>
      )}
    </div>
  );
}
