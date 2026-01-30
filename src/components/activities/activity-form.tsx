"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createActivity, updateActivity } from "@/app/actions/activities";
import { ActivityFormFields } from "./activity-form-fields";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "@prisma/client";

interface ActivityFormProps {
  activity?: Activity;
  tarId: string;
  tarDescription?: string;
  bigRockId: string;
  mode: "create" | "edit";
}

/**
 * Form component for creating/editing Activities
 * Client Component - uses useActionState for progressive enhancement
 */
export function ActivityForm({
  activity,
  tarId,
  tarDescription,
  bigRockId,
  mode,
}: ActivityFormProps) {
  const router = useRouter();

  // Use appropriate action based on mode
  const action = mode === "create" ? createActivity : updateActivity.bind(null, activity!.id);

  const [state, formAction, isPending] = useActionState(action, null);

  // Handle successful creation - redirect back to TAR detail
  useEffect(() => {
    if (state?.success && mode === "create") {
      router.push(`/big-rocks/${bigRockId}/tars/${tarId}`);
    }
  }, [state, mode, bigRockId, tarId, router]);

  // Handle successful update - redirect back to TAR detail
  useEffect(() => {
    if (state?.success && mode === "edit") {
      router.push(`/big-rocks/${bigRockId}/tars/${tarId}`);
    }
  }, [state, mode, bigRockId, tarId, router]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {mode === "create" ? "Crear Actividad" : "Editar Actividad"}
        </CardTitle>
        {tarDescription && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            TAR: {tarDescription}
          </p>
        )}
      </CardHeader>

      <CardContent>
        <form action={formAction} className="space-y-6">
          <ActivityFormFields
            defaultValues={activity}
            tarId={tarId}
            isPending={isPending}
            mode={mode}
          />

          {/* Error message */}
          {state?.error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              <p className="text-sm font-medium">Error</p>
              <p className="text-sm">{state.error}</p>
            </div>
          )}

          {/* Success message */}
          {state?.success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
              <p className="text-sm font-medium">Exito!</p>
              <p className="text-sm">
                {mode === "create"
                  ? "Actividad creada correctamente. Redirigiendo..."
                  : "Actividad actualizada correctamente. Redirigiendo..."}
              </p>
            </div>
          )}

          {/* Form actions */}
          <div className="flex gap-2">
            <Button type="submit" disabled={isPending}>
              {isPending
                ? mode === "create"
                  ? "Creando..."
                  : "Guardando..."
                : mode === "create"
                ? "Crear Actividad"
                : "Guardar Cambios"}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isPending}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
