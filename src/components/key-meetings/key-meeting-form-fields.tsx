"use client";

import { KeyMeeting } from "@prisma/client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface KeyMeetingFormFieldsProps {
  defaultValues?: Partial<KeyMeeting>;
  bigRockId: string;
  isPending?: boolean;
  mode?: "create" | "edit";
}

/**
 * Reusable form fields for KeyMeeting create/edit forms
 * Client Component - needs state and interactivity
 */
export function KeyMeetingFormFields({
  defaultValues,
  bigRockId,
  isPending = false,
  mode = "create",
}: KeyMeetingFormFieldsProps) {
  // Format date for datetime-local input
  const formatDateForInput = (date?: Date | string | null): string => {
    if (!date) return "";
    const d = typeof date === "string" ? new Date(date) : date;
    // Format as YYYY-MM-DDTHH:mm for datetime-local input
    return d.toISOString().slice(0, 16);
  };

  return (
    <div className="space-y-4">
      {/* Hidden field for bigRockId */}
      <input type="hidden" name="bigRockId" value={bigRockId} />

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">
          Titulo <span className="text-red-500">*</span>
        </Label>
        <Input
          id="title"
          name="title"
          type="text"
          placeholder="Ej: Reunion de revision con el equipo"
          defaultValue={defaultValues?.title}
          required
          minLength={3}
          maxLength={200}
          disabled={isPending}
        />
        <p className="text-xs text-muted-foreground">
          Entre 3 y 200 caracteres. Describe el proposito de la reunion.
        </p>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Descripcion</Label>
        <textarea
          id="description"
          name="description"
          placeholder="Detalles adicionales sobre la reunion..."
          defaultValue={defaultValues?.description || ""}
          maxLength={2000}
          rows={3}
          disabled={isPending}
          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        />
        <p className="text-xs text-muted-foreground">
          Opcional. Maximo 2000 caracteres.
        </p>
      </div>

      {/* Date */}
      <div className="space-y-2">
        <Label htmlFor="date">
          Fecha y hora <span className="text-red-500">*</span>
        </Label>
        <Input
          id="date"
          name="date"
          type="datetime-local"
          defaultValue={formatDateForInput(defaultValues?.date)}
          required
          disabled={isPending}
        />
        <p className="text-xs text-muted-foreground">
          Selecciona cuando se realizara la reunion.
        </p>
      </div>

      {/* Completed (only in edit mode) */}
      {mode === "edit" && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              id="completed"
              name="completed"
              type="checkbox"
              value="true"
              defaultChecked={defaultValues?.completed}
              disabled={isPending}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <Label htmlFor="completed" className="font-normal">
              Marcar como completada
            </Label>
          </div>
        </div>
      )}

      {/* Outcome (only in edit mode) */}
      {mode === "edit" && (
        <div className="space-y-2">
          <Label htmlFor="outcome">Resultado de la reunion</Label>
          <textarea
            id="outcome"
            name="outcome"
            placeholder="Describe los resultados, decisiones o acuerdos de la reunion..."
            defaultValue={defaultValues?.outcome || ""}
            maxLength={2000}
            rows={3}
            disabled={isPending}
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          />
          <p className="text-xs text-muted-foreground">
            Opcional. Documenta los resultados despues de la reunion.
          </p>
        </div>
      )}
    </div>
  );
}
