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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import { createKeyResult } from "@/app/actions/okr";

interface TeamMember {
  id: string;
  name: string | null;
  image: string | null;
}

interface AddKeyResultDialogProps {
  objectiveId: string;
  teamMembers: TeamMember[];
}

const COMMON_UNITS = ["%", "#", "€", "$", "puntos", "días", "horas"];

export function AddKeyResultDialog({
  objectiveId,
  teamMembers,
}: AddKeyResultDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [indicator, setIndicator] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [startValue, setStartValue] = useState("0");
  const [unit, setUnit] = useState("%");

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setIndicator("");
    setTargetValue("");
    setStartValue("0");
    setUnit("%");
    setError(null);
  };

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
      const result = await createKeyResult({
        objectiveId,
        title: title.trim(),
        description: description.trim() || undefined,
        indicator: indicator.trim(),
        targetValue: target,
        startValue: start,
        unit,
      });

      if (result.success) {
        resetForm();
        setOpen(false);
      } else {
        setError(result.error || "Error al crear el Key Result");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Añadir Key Result
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo Key Result</DialogTitle>
          <DialogDescription>
            Define un resultado clave medible para este objetivo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="kr-title">Título *</Label>
            <Input
              id="kr-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Aumentar NPS de clientes"
              disabled={isPending}
            />
          </div>

          {/* Indicator */}
          <div className="space-y-2">
            <Label htmlFor="kr-indicator">Indicador *</Label>
            <Input
              id="kr-indicator"
              value={indicator}
              onChange={(e) => setIndicator(e.target.value)}
              placeholder="Ej: Net Promoter Score"
              disabled={isPending}
            />
          </div>

          {/* Values */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="kr-start">Valor inicial</Label>
              <Input
                id="kr-start"
                type="number"
                step="any"
                value={startValue}
                onChange={(e) => setStartValue(e.target.value)}
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kr-target">Valor objetivo *</Label>
              <Input
                id="kr-target"
                type="number"
                step="any"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kr-unit">Unidad</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger id="kr-unit">
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
            <Label htmlFor="kr-description">Descripción</Label>
            <Textarea
              id="kr-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe cómo se medirá este resultado..."
              rows={2}
              disabled={isPending}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !title.trim() || !indicator.trim() || !targetValue}
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creando...
              </>
            ) : (
              "Crear Key Result"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
