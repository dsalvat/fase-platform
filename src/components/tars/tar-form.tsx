"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createTAR, updateTAR } from "@/app/actions/tars";
import { TARFormFields } from "./tar-form-fields";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TAR } from "@prisma/client";

interface TARFormProps {
  tar?: TAR;
  bigRockId: string;
  bigRockTitle?: string;
  mode: "create" | "edit";
}

/**
 * Form component for creating/editing TARs
 * Client Component - uses useActionState for progressive enhancement
 */
export function TARForm({ tar, bigRockId, bigRockTitle, mode }: TARFormProps) {
  const router = useRouter();

  // Use appropriate action based on mode
  const action = mode === "create" ? createTAR : updateTAR.bind(null, tar!.id);

  const [state, formAction, isPending] = useActionState(action, null);

  // Handle successful creation - redirect to the Big Rock detail page (TAR list)
  useEffect(() => {
    if (state?.success && mode === "create") {
      router.push(`/big-rocks/${bigRockId}`);
    }
  }, [state, mode, bigRockId, router]);

  // Handle successful update - redirect to detail page
  useEffect(() => {
    if (state?.success && mode === "edit" && tar?.id) {
      router.push(`/big-rocks/${bigRockId}/tars/${tar.id}`);
    }
  }, [state, mode, tar, bigRockId, router]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {mode === "create" ? "Crear TAR" : "Editar TAR"}
        </CardTitle>
        {bigRockTitle && (
          <p className="text-sm text-muted-foreground">
            Big Rock: {bigRockTitle}
          </p>
        )}
      </CardHeader>

      <CardContent>
        <form action={formAction} className="space-y-6">
          <TARFormFields
            defaultValues={tar}
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
                  ? "TAR creada correctamente. Redirigiendo..."
                  : "TAR actualizada correctamente. Redirigiendo..."}
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
                ? "Crear TAR"
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
