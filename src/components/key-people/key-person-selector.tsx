"use client";

import { useState, useTransition } from "react";
import { KeyPerson } from "@prisma/client";
import {
  linkKeyPersonToTAR,
  unlinkKeyPersonFromTAR,
} from "@/app/actions/key-people";
import { Button } from "@/components/ui/button";
import { User, X, Plus, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface KeyPersonSelectorProps {
  tarId: string;
  availableKeyPeople: KeyPerson[];
  linkedKeyPeople: KeyPerson[];
  isReadOnly?: boolean;
}

/**
 * Multi-select component to link/unlink Key People to a TAR
 * Client Component - manages selection state and server actions
 */
export function KeyPersonSelector({
  tarId,
  availableKeyPeople,
  linkedKeyPeople,
  isReadOnly = false,
}: KeyPersonSelectorProps) {
  const [showSelector, setShowSelector] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Get IDs of linked people for filtering
  const linkedIds = new Set(linkedKeyPeople.map((p) => p.id));

  // Filter out already linked people from available
  const unlinkedPeople = availableKeyPeople.filter(
    (p) => !linkedIds.has(p.id)
  );

  const handleLink = (keyPersonId: string) => {
    startTransition(async () => {
      try {
        const result = await linkKeyPersonToTAR(keyPersonId, tarId);

        if (!result.success) {
          setError(result.error || "Error al vincular la persona clave");
        } else {
          setError(null);
        }
      } catch {
        setError("Error inesperado al vincular la persona clave");
      }
    });
  };

  const handleUnlink = (keyPersonId: string) => {
    startTransition(async () => {
      try {
        const result = await unlinkKeyPersonFromTAR(keyPersonId, tarId);

        if (!result.success) {
          setError(result.error || "Error al desvincular la persona clave");
        } else {
          setError(null);
        }
      } catch {
        setError("Error inesperado al desvincular la persona clave");
      }
    });
  };

  return (
    <div className="space-y-3">
      {/* Currently linked people */}
      {linkedKeyPeople.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">
            Personas clave vinculadas
          </h4>
          <div className="flex flex-wrap gap-2">
            {linkedKeyPeople.map((person) => (
              <div
                key={person.id}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-sm",
                  isPending && "opacity-50"
                )}
              >
                <User className="h-3 w-3" />
                <span>
                  {person.firstName} {person.lastName}
                </span>
                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={() => handleUnlink(person.id)}
                    disabled={isPending}
                    className="hover:bg-blue-100 rounded-full p-0.5 transition-colors"
                    title="Desvincular"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {linkedKeyPeople.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No hay personas clave vinculadas a esta TAR.
        </p>
      )}

      {/* Add selector */}
      {!isReadOnly && (
        <>
          {!showSelector ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowSelector(true)}
              disabled={isPending || unlinkedPeople.length === 0}
            >
              <Plus className="h-4 w-4 mr-2" />
              Vincular persona clave
            </Button>
          ) : (
            <div className="border rounded-lg p-3 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">
                  Seleccionar persona clave
                </h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSelector(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {unlinkedPeople.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Todas las personas clave ya estan vinculadas o no tienes
                  personas clave creadas.
                </p>
              ) : (
                <div className="space-y-1">
                  {unlinkedPeople.map((person) => (
                    <button
                      key={person.id}
                      type="button"
                      onClick={() => handleLink(person.id)}
                      disabled={isPending}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors",
                        "hover:bg-gray-100",
                        isPending && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                        <User className="h-4 w-4 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {person.firstName} {person.lastName}
                        </p>
                        {person.role && (
                          <p className="text-xs text-muted-foreground truncate">
                            {person.role}
                          </p>
                        )}
                      </div>
                      <Check className="h-4 w-4 text-transparent group-hover:text-blue-500" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Error display */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">
          {error}
        </div>
      )}
    </div>
  );
}
