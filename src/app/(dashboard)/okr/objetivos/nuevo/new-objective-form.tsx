"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { createObjective } from "@/app/actions/okr";

interface Team {
  id: string;
  name: string;
}

interface NewObjectiveFormProps {
  teams: Team[];
  quarterId: string;
  preselectedTeamId?: string;
}

export function NewObjectiveForm({
  teams,
  quarterId,
  preselectedTeamId,
}: NewObjectiveFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [indicator, setIndicator] = useState("");
  const [teamId, setTeamId] = useState(preselectedTeamId || "");

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

    if (!teamId) {
      setError("Selecciona un equipo");
      return;
    }

    startTransition(async () => {
      const result = await createObjective({
        title: title.trim(),
        description: description.trim() || undefined,
        indicator: indicator.trim(),
        teamId,
        quarterId,
      });

      if (result.success && result.data) {
        router.push(`/okr/objetivos/${result.data.id}`);
      } else {
        setError(result.error || "Error al crear el objetivo");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Team */}
      <div className="space-y-2">
        <Label htmlFor="team">Equipo *</Label>
        <Select value={teamId} onValueChange={setTeamId}>
          <SelectTrigger id="team">
            <SelectValue placeholder="Selecciona un equipo" />
          </SelectTrigger>
          <SelectContent>
            {teams.map((team) => (
              <SelectItem key={team.id} value={team.id}>
                {team.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">Título del Objetivo *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ej: Aumentar la satisfacción del cliente"
          disabled={isPending}
        />
        <p className="text-sm text-muted-foreground">
          El objetivo debe ser ambicioso pero alcanzable
        </p>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe el contexto y por qué este objetivo es importante..."
          rows={3}
          disabled={isPending}
        />
      </div>

      {/* Indicator */}
      <div className="space-y-2">
        <Label htmlFor="indicator">Indicador de Éxito *</Label>
        <Input
          id="indicator"
          value={indicator}
          onChange={(e) => setIndicator(e.target.value)}
          placeholder="Ej: NPS > 50, Tasa de retención > 85%"
          disabled={isPending}
        />
        <p className="text-sm text-muted-foreground">
          Define cómo medirás el éxito de este objetivo
        </p>
      </div>

      {/* Info box */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Tip:</strong> Después de crear el objetivo, podrás añadir
          Key Results (resultados clave) que te ayudarán a medir el progreso.
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Link href="/okr/objetivos">
          <Button type="button" variant="outline">
            Cancelar
          </Button>
        </Link>
        <Button
          type="submit"
          disabled={isPending || !title.trim() || !indicator.trim() || !teamId}
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creando...
            </>
          ) : (
            "Crear Objetivo"
          )}
        </Button>
      </div>
    </form>
  );
}
