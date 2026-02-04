"use client";

import { useActionState, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createBigRock, updateBigRock } from "@/app/actions/big-rocks";
import { BigRockFormFields } from "./big-rock-form-fields";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BigRockWithCounts } from "@/types/big-rock";
import { KeyMeeting } from "@prisma/client";
import { InlineKeyMeeting } from "@/types/inline-forms";

interface UserOption {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

interface BigRockFormProps {
  bigRock?: BigRockWithCounts;
  mode: "create" | "edit";
  defaultMonth?: string;
  availableUsers?: UserOption[];
  isConfirmed?: boolean;
  canResetStatus?: boolean;
}

/**
 * Convert existing KeyMeetings to InlineKeyMeeting format
 */
function convertToInlineKeyMeetings(meetings: KeyMeeting[] | undefined): InlineKeyMeeting[] {
  if (!meetings) return [];
  return meetings.map((m) => ({
    title: m.title,
    objective: m.objective || "",
    expectedDecision: m.expectedDecision || null,
    date: m.date instanceof Date ? m.date.toISOString() : m.date,
    description: m.description || null,
  }));
}

/**
 * Form component for creating/editing Big Rocks
 * Client Component - uses useActionState for progressive enhancement
 */
export function BigRockForm({ bigRock, mode, defaultMonth, availableUsers = [], isConfirmed = false, canResetStatus = false }: BigRockFormProps) {
  const router = useRouter();

  // State for key people (now just user IDs)
  const [selectedKeyPeopleIds, setSelectedKeyPeopleIds] = useState<string[]>(
    bigRock?.keyPeople?.map((p) => p.userId) || []
  );

  // State for key meetings
  const [keyMeetings, setKeyMeetings] = useState<InlineKeyMeeting[]>(
    convertToInlineKeyMeetings(bigRock?.keyMeetings)
  );

  // Key People handlers
  const handleSelectKeyPerson = useCallback((userId: string) => {
    setSelectedKeyPeopleIds((prev) => [...prev, userId]);
  }, []);

  const handleDeselectKeyPerson = useCallback((userId: string) => {
    setSelectedKeyPeopleIds((prev) => prev.filter((id) => id !== userId));
  }, []);

  // Key Meetings handlers
  const handleAddKeyMeeting = useCallback((meeting: InlineKeyMeeting) => {
    setKeyMeetings((prev) => [...prev, meeting]);
  }, []);

  const handleRemoveKeyMeeting = useCallback((index: number) => {
    setKeyMeetings((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleUpdateKeyMeeting = useCallback((index: number, meeting: InlineKeyMeeting) => {
    setKeyMeetings((prev) => prev.map((m, i) => (i === index ? meeting : m)));
  }, []);

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
          {/* Hidden inputs for key people and meetings data */}
          <input
            type="hidden"
            name="keyPeopleIds"
            value={JSON.stringify(selectedKeyPeopleIds)}
          />
          <input
            type="hidden"
            name="keyMeetings"
            value={JSON.stringify(keyMeetings)}
          />

          <BigRockFormFields
            defaultValues={bigRock}
            defaultMonth={defaultMonth}
            isPending={isPending}
            mode={mode}
            isConfirmed={isConfirmed}
            canResetStatus={canResetStatus}
            // Key People (Users) props
            availableUsers={availableUsers}
            selectedKeyPeopleIds={selectedKeyPeopleIds}
            onSelectKeyPerson={handleSelectKeyPerson}
            onDeselectKeyPerson={handleDeselectKeyPerson}
            // Key Meetings props
            keyMeetings={keyMeetings}
            onAddKeyMeeting={handleAddKeyMeeting}
            onRemoveKeyMeeting={handleRemoveKeyMeeting}
            onUpdateKeyMeeting={handleUpdateKeyMeeting}
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
                  ? "Big Rock creado correctamente. Redirigiendo..."
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
