"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBigRock, updateBigRock } from "@/app/actions/big-rocks";
import { BigRockFormFields } from "./big-rock-form-fields";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BigRockWithCounts } from "@/types/big-rock";

interface BigRockFormProps {
  bigRock?: BigRockWithCounts;
  mode: "create" | "edit";
  defaultMonth?: string;
}

/**
 * Form component for creating/editing Big Rocks
 * Client Component - uses useActionState for progressive enhancement
 */
export function BigRockForm({ bigRock, mode, defaultMonth }: BigRockFormProps) {
  const router = useRouter();

  // Use appropriate action based on mode
  const action = mode === "create" ? createBigRock : updateBigRock.bind(null, bigRock!.id);

  const [state, formAction, isPending] = useActionState(action, null);

  // Handle successful creation - redirect to the Big Rocks list
  useEffect(() => {
    if (state?.success && mode === "create") {
      router.push("/big-rocks");
    }
  }, [state, mode, router]);

  // Handle successful update - redirect to detail page
  useEffect(() => {
    if (state?.success && mode === "edit" && bigRock?.id) {
      router.push(`/big-rocks/${bigRock.id}`);
    }
  }, [state, mode, bigRock, router]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {mode === "create" ? "Crear Big Rock" : "Editar Big Rock"}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form action={formAction} className="space-y-6">
          <BigRockFormFields
            defaultValues={bigRock}
            defaultMonth={defaultMonth}
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
              <p className="text-sm font-medium">¡Éxito!</p>
              <p className="text-sm">
                {mode === "create"
                  ? `Big Rock "${state.title}" creado correctamente. Redirigiendo...`
                  : "Big Rock actualizado correctamente. Redirigiendo..."}
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
                ? "Crear Big Rock"
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
