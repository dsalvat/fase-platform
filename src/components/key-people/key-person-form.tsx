"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createKeyPerson, updateKeyPerson } from "@/app/actions/key-people";
import { KeyPersonFormFields } from "./key-person-form-fields";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KeyPerson } from "@prisma/client";

interface KeyPersonFormProps {
  keyPerson?: KeyPerson;
  mode: "create" | "edit";
}

/**
 * Form component for creating/editing Key People
 * Client Component - uses useActionState for progressive enhancement
 */
export function KeyPersonForm({ keyPerson, mode }: KeyPersonFormProps) {
  const router = useRouter();

  // Use appropriate action based on mode
  const action =
    mode === "create"
      ? createKeyPerson
      : updateKeyPerson.bind(null, keyPerson!.id);

  const [state, formAction, isPending] = useActionState(action, null);

  // Handle successful creation - redirect to list
  useEffect(() => {
    if (state?.success && mode === "create") {
      router.push("/key-people");
    }
  }, [state, mode, router]);

  // Handle successful update - redirect to detail
  useEffect(() => {
    if (state?.success && mode === "edit" && keyPerson?.id) {
      router.push(`/key-people/${keyPerson.id}`);
    }
  }, [state, mode, keyPerson, router]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {mode === "create" ? "Crear Persona Clave" : "Editar Persona Clave"}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form action={formAction} className="space-y-6">
          <KeyPersonFormFields
            defaultValues={keyPerson}
            isPending={isPending}
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
                  ? "Persona clave creada correctamente. Redirigiendo..."
                  : "Persona clave actualizada correctamente. Redirigiendo..."}
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
                ? "Crear Persona"
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
