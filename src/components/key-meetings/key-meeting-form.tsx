"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createKeyMeeting, updateKeyMeeting } from "@/app/actions/key-meetings";
import { KeyMeetingFormFields } from "./key-meeting-form-fields";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KeyMeeting } from "@prisma/client";

interface KeyMeetingFormProps {
  keyMeeting?: KeyMeeting;
  bigRockId: string;
  bigRockTitle?: string;
  mode: "create" | "edit";
}

/**
 * Form component for creating/editing Key Meetings
 * Client Component - uses useActionState for progressive enhancement
 */
export function KeyMeetingForm({
  keyMeeting,
  bigRockId,
  bigRockTitle,
  mode,
}: KeyMeetingFormProps) {
  const router = useRouter();

  // Use appropriate action based on mode
  const action =
    mode === "create"
      ? createKeyMeeting
      : updateKeyMeeting.bind(null, keyMeeting!.id);

  const [state, formAction, isPending] = useActionState(action, null);

  // Handle successful creation - redirect to meetings list
  useEffect(() => {
    if (state?.success && mode === "create") {
      router.push(`/big-rocks/${bigRockId}/meetings`);
    }
  }, [state, mode, bigRockId, router]);

  // Handle successful update - redirect to meeting detail
  useEffect(() => {
    if (state?.success && mode === "edit" && keyMeeting?.id) {
      router.push(`/big-rocks/${bigRockId}/meetings/${keyMeeting.id}`);
    }
  }, [state, mode, keyMeeting, bigRockId, router]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {mode === "create" ? "Crear Reunion Clave" : "Editar Reunion Clave"}
        </CardTitle>
        {bigRockTitle && (
          <p className="text-sm text-muted-foreground">
            Big Rock: {bigRockTitle}
          </p>
        )}
      </CardHeader>

      <CardContent>
        <form action={formAction} className="space-y-6">
          <KeyMeetingFormFields
            defaultValues={keyMeeting}
            bigRockId={bigRockId}
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
                  ? "Reunion clave creada correctamente. Redirigiendo..."
                  : "Reunion clave actualizada correctamente. Redirigiendo..."}
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
                ? "Crear Reunion"
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
