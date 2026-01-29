"use client";

import { useState, useTransition } from "react";
import { TarStatus } from "@prisma/client";
import { updateTARStatus } from "@/app/actions/tars";
import { Button } from "@/components/ui/button";
import { TARStatusBadge } from "./tar-status-badge";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface TARStatusToggleProps {
  tarId: string;
  initialStatus: TarStatus;
  disabled?: boolean;
}

const statusOrder: TarStatus[] = ["PENDIENTE", "EN_PROGRESO", "COMPLETADA"];

/**
 * Client Component for quickly changing TAR status
 */
export function TARStatusToggle({
  tarId,
  initialStatus,
  disabled = false,
}: TARStatusToggleProps) {
  const [status, setStatus] = useState(initialStatus);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleStatusChange = (newStatus: TarStatus) => {
    if (newStatus === status) {
      setIsOpen(false);
      return;
    }

    startTransition(async () => {
      setError(null);
      const result = await updateTARStatus(tarId, newStatus);

      if (result.success) {
        setStatus(newStatus);
        setIsOpen(false);
      } else {
        setError(result.error || "Error al actualizar el estado");
      }
    });
  };

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled || isPending}
        className="gap-2"
      >
        <TARStatusBadge status={status} size="sm" showIcon={false} />
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform",
            isOpen && "transform rotate-180"
          )}
        />
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-1 bg-white border rounded-md shadow-lg z-50 min-w-[160px]">
            {statusOrder.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => handleStatusChange(s)}
                disabled={isPending}
                className={cn(
                  "w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2",
                  s === status && "bg-gray-100",
                  isPending && "opacity-50 cursor-not-allowed"
                )}
              >
                <TARStatusBadge status={s} size="sm" />
              </button>
            ))}
          </div>
        </>
      )}

      {error && (
        <p className="absolute top-full left-0 mt-1 text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}
