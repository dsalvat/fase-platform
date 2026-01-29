"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { openMonth } from "@/app/actions/calendar";

interface OpenMonthButtonProps {
  month: string;
  onSuccess?: () => void;
}

export function OpenMonthButton({ month, onSuccess }: OpenMonthButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleClick = () => {
    setError(null);
    startTransition(async () => {
      const result = await openMonth(month);
      if (result.success) {
        onSuccess?.();
      } else {
        setError(result.error || "Error al abrir el mes");
      }
    });
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <Button
        onClick={handleClick}
        disabled={isPending}
        variant="default"
        size="lg"
      >
        {isPending ? "Abriendo..." : "Abrir Mes para Planificación"}
      </Button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
