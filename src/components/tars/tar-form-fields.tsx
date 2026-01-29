"use client";

import { TAR } from "@prisma/client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { tarStatusConfig } from "@/types/tar";

interface TARFormFieldsProps {
  defaultValues?: Partial<TAR>;
  bigRockId: string;
  isPending?: boolean;
  mode?: "create" | "edit";
}

const statusOptions = Object.entries(tarStatusConfig).map(([value, config]) => ({
  value,
  label: config.label,
}));

/**
 * Reusable form fields for TAR create/edit forms
 * Client Component - needs state and interactivity
 */
export function TARFormFields({
  defaultValues,
  bigRockId,
  isPending = false,
  mode = "create",
}: TARFormFieldsProps) {
  return (
    <div className="space-y-4">
      {/* Hidden field for bigRockId */}
      <input type="hidden" name="bigRockId" value={bigRockId} />

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">
          Descripción <span className="text-red-500">*</span>
        </Label>
        <textarea
          id="description"
          name="description"
          placeholder="Describe la tarea de alto rendimiento..."
          defaultValue={defaultValues?.description}
          required
          minLength={5}
          maxLength={2000}
          rows={4}
          disabled={isPending}
          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        />
        <p className="text-xs text-muted-foreground">
          Entre 5 y 2000 caracteres. Describe claramente qué necesitas lograr.
        </p>
      </div>

      {/* Status (only in edit mode) */}
      {mode === "edit" && (
        <div className="space-y-2">
          <Label htmlFor="status">Estado</Label>
          <Select
            name="status"
            defaultValue={defaultValues?.status || "PENDIENTE"}
            disabled={isPending}
          >
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Progress (only in edit mode) */}
      {mode === "edit" && (
        <div className="space-y-2">
          <Label htmlFor="progress">
            Progreso: {defaultValues?.progress ?? 0}%
          </Label>
          <Input
            id="progress"
            name="progress"
            type="range"
            min={0}
            max={100}
            step={5}
            defaultValue={defaultValues?.progress ?? 0}
            disabled={isPending}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Indica el porcentaje de completitud de esta TAR.
          </p>
        </div>
      )}
    </div>
  );
}
