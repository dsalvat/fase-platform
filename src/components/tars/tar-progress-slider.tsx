"use client";

import { useState, useTransition } from "react";
import { updateTARProgress } from "@/app/actions/tars";
import { cn } from "@/lib/utils";

interface TARProgressSliderProps {
  tarId: string;
  initialProgress: number;
  disabled?: boolean;
}

/**
 * Client Component for updating TAR progress with a slider
 */
export function TARProgressSlider({
  tarId,
  initialProgress,
  disabled = false,
}: TARProgressSliderProps) {
  const [progress, setProgress] = useState(initialProgress);
  const [savedProgress, setSavedProgress] = useState(initialProgress);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newProgress = Number(e.target.value);
    setProgress(newProgress);
  };

  const handleSave = () => {
    if (progress === savedProgress) return;

    startTransition(async () => {
      setError(null);
      const result = await updateTARProgress(tarId, progress);

      if (result.success) {
        setSavedProgress(progress);
      } else {
        setError(result.error || "Error al actualizar el progreso");
        setProgress(savedProgress); // Revert to saved value
      }
    });
  };

  const hasChanges = progress !== savedProgress;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">Progreso</label>
        <span
          className={cn(
            "text-lg font-semibold",
            progress === 100
              ? "text-green-600"
              : progress > 0
              ? "text-blue-600"
              : "text-gray-500"
          )}
        >
          {progress}%
        </span>
      </div>

      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={progress}
        onChange={handleChange}
        onMouseUp={handleSave}
        onTouchEnd={handleSave}
        disabled={disabled || isPending}
        className={cn(
          "w-full h-2 rounded-lg appearance-none cursor-pointer",
          "bg-gray-200",
          "[&::-webkit-slider-thumb]:appearance-none",
          "[&::-webkit-slider-thumb]:w-4",
          "[&::-webkit-slider-thumb]:h-4",
          "[&::-webkit-slider-thumb]:rounded-full",
          "[&::-webkit-slider-thumb]:bg-blue-500",
          "[&::-webkit-slider-thumb]:cursor-pointer",
          "[&::-webkit-slider-thumb]:shadow-md",
          "[&::-moz-range-thumb]:w-4",
          "[&::-moz-range-thumb]:h-4",
          "[&::-moz-range-thumb]:rounded-full",
          "[&::-moz-range-thumb]:bg-blue-500",
          "[&::-moz-range-thumb]:cursor-pointer",
          "[&::-moz-range-thumb]:border-none",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      />

      {/* Progress bar visual */}
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full transition-all duration-200",
            progress === 100
              ? "bg-green-500"
              : progress > 0
              ? "bg-blue-500"
              : "bg-gray-300"
          )}
          style={{ width: `${progress}%` }}
        />
      </div>

      {hasChanges && (
        <p className="text-xs text-muted-foreground">
          {isPending ? "Guardando..." : "Suelta para guardar"}
        </p>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
