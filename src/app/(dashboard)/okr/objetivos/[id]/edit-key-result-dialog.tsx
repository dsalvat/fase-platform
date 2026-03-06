"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { updateKeyResult } from "@/app/actions/okr";

interface EditKeyResultDialogProps {
  keyResult: {
    id: string;
    title: string;
    description: string | null;
    indicator: string;
    targetValue: number;
    startValue: number;
    unit: string;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const COMMON_UNITS = ["%", "#", "€", "$", "puntos", "días", "horas"];

export function EditKeyResultDialog({
  keyResult,
  open,
  onOpenChange,
}: EditKeyResultDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(keyResult.title);
  const [description, setDescription] = useState(keyResult.description || "");
  const [indicator, setIndicator] = useState(keyResult.indicator);
  const [targetValue, setTargetValue] = useState(keyResult.targetValue.toString());
  const [startValue, setStartValue] = useState(keyResult.startValue.toString());
  const [unit, setUnit] = useState(keyResult.unit);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("El título es obligatorio");
      return;
    }

    if (!indicator.trim()) {
      setError("El indicador es obligatorio");
      return;
    }

    const target = parseFloat(targetValue);
    if (isNaN(target)) {
      setError("El valor objetivo debe ser un número");
      return;
    }

    const start = parseFloat(startValue) || 0;

    startTransition(async () => {
      const result = await updateKeyResult(keyResult.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        indicator: indicator.trim(),
        targetValue: target,
        unit,
      });

      if (result.success) {
        onOpenChange(false);
      } else {
        setError(result.error || "Error al actualizar el Key Result");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Key Result</DialogTitle>
          <DialogDescription>
            Modifica los datos del resultado clave.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="edit-kr-title">Título *</Label>
            <Input
              id="edit-kr-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isPending}
            />
          </div>

          {/* Indicator */}
          <div className="space-y-2">
            <Label htmlFor="edit-kr-indicator">Indicador *</Label>
            <Input
              id="edit-kr-indicator"
              value={indicator}
              onChange={(e) => setIndicator(e.target.value)}
              disabled={isPending}
            />
          </div>

          {/* Values */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="edit-kr-start">Valor inicial</Label>
              <Input
                id="edit-kr-start"
                type="number"
                step="any"
                value={startValue}
                onChange={(e) => setStartValue(e.target.value)}
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-kr-target">Valor objetivo *</Label>
              <Input
                id="edit-kr-target"
                type="number"
                step="any"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-kr-unit">Unidad</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger id="edit-kr-unit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_UNITS.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="edit-kr-description">Descripción</Label>
            <Textarea
              id="edit-kr-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              disabled={isPending}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !title.trim() || !indicator.trim() || !targetValue}
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar cambios"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
