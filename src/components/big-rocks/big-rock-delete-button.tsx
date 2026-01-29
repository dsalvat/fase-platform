"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteBigRock } from "@/app/actions/big-rocks";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface BigRockDeleteButtonProps {
  bigRockId: string;
  bigRockTitle: string;
}

/**
 * Client Component for deleting a Big Rock with confirmation
 * Shows confirmation dialog before deletion
 */
export function BigRockDeleteButton({
  bigRockId,
  bigRockTitle,
}: BigRockDeleteButtonProps) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      try {
        const result = await deleteBigRock(bigRockId);

        if (result.success) {
          // Redirect to list page after successful deletion
          router.push("/big-rocks");
        } else {
          setError(result.error || "Error al eliminar el Big Rock");
        }
      } catch {
        setError("Error inesperado al eliminar el Big Rock");
      }
    });
  };

  if (!showConfirm) {
    return (
      <Button
        type="button"
        variant="destructive"
        size="sm"
        onClick={() => setShowConfirm(true)}
        disabled={isPending}
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Eliminar
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Confirmar eliminación
        </h3>

        <p className="text-sm text-gray-600 mb-4">
          ¿Estás seguro de que quieres eliminar el Big Rock &ldquo;
          <strong>{bigRockTitle}</strong>&rdquo;? Esta acción no se puede deshacer y se
          eliminarán también todas las TARs y reuniones asociadas.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="flex gap-2 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setShowConfirm(false);
              setError(null);
            }}
            disabled={isPending}
          >
            Cancelar
          </Button>

          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? "Eliminando..." : "Eliminar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
