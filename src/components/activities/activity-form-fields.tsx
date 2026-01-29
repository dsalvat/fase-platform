"use client";

import { Activity } from "@prisma/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { activityTypeConfig } from "@/types/activity";
import { format } from "date-fns";

interface ActivityFormFieldsProps {
  defaultValues?: Partial<Activity>;
  tarId: string;
  isPending?: boolean;
  mode?: "create" | "edit";
}

const typeOptions = Object.entries(activityTypeConfig).map(([value, config]) => ({
  value,
  label: config.label,
}));

/**
 * Reusable form fields for Activity create/edit forms
 * Client Component
 */
export function ActivityFormFields({
  defaultValues,
  tarId,
  isPending = false,
  mode = "create",
}: ActivityFormFieldsProps) {
  // Format date for input
  const defaultDate = defaultValues?.date
    ? format(new Date(defaultValues.date), "yyyy-MM-dd")
    : format(new Date(), "yyyy-MM-dd");

  return (
    <div className="space-y-4">
      {/* Hidden field for tarId */}
      <input type="hidden" name="tarId" value={tarId} />

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">
          Titulo <span className="text-red-500">*</span>
        </Label>
        <Input
          id="title"
          name="title"
          placeholder="Describe la actividad..."
          defaultValue={defaultValues?.title}
          required
          minLength={3}
          maxLength={200}
          disabled={isPending}
        />
        <p className="text-xs text-muted-foreground">
          Entre 3 y 200 caracteres
        </p>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Descripcion</Label>
        <textarea
          id="description"
          name="description"
          placeholder="Detalles adicionales (opcional)..."
          defaultValue={defaultValues?.description || ""}
          maxLength={2000}
          rows={3}
          disabled={isPending}
          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      {/* Type */}
      <div className="space-y-2">
        <Label htmlFor="type">
          Tipo <span className="text-red-500">*</span>
        </Label>
        <Select
          name="type"
          defaultValue={defaultValues?.type || "DIARIA"}
          required
          disabled={isPending}
        >
          <SelectTrigger id="type">
            <SelectValue placeholder="Selecciona el tipo" />
          </SelectTrigger>
          <SelectContent>
            {typeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Semanal para objetivos de la semana, Diaria para tareas del dia
        </p>
      </div>

      {/* Date */}
      <div className="space-y-2">
        <Label htmlFor="date">
          Fecha <span className="text-red-500">*</span>
        </Label>
        <Input
          id="date"
          name="date"
          type="date"
          defaultValue={defaultDate}
          required
          disabled={isPending}
        />
      </div>

      {/* Notes (only in edit mode or when completing) */}
      {mode === "edit" && (
        <>
          <div className="space-y-2">
            <Label htmlFor="notes">Notas / Reflexion</Label>
            <textarea
              id="notes"
              name="notes"
              placeholder="Anota aprendizajes o reflexiones..."
              defaultValue={defaultValues?.notes || ""}
              maxLength={2000}
              rows={3}
              disabled={isPending}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {/* Completed checkbox */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="completed"
              name="completed"
              value="true"
              defaultChecked={defaultValues?.completed}
              disabled={isPending}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="completed" className="text-sm font-normal">
              Marcar como completada
            </Label>
          </div>
        </>
      )}
    </div>
  );
}
