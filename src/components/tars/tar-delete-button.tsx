"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteTAR } from "@/app/actions/tars";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface TARDeleteButtonProps {
  tarId: string;
  tarDescription: string;
  bigRockId: string;
}

/**
 * Client Component for deleting a TAR with confirmation
 * Shows confirmation dialog before deletion
 */
export function TARDeleteButton({
  tarId,
  tarDescription,
  bigRockId,
}: TARDeleteButtonProps) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      try {
        const result = await deleteTAR(tarId);

        if (result.success) {
          // Redirect to Big Rock detail page after successful deletion
          router.push(`/big-rocks/${bigRockId}`);
        } else {
          setError(result.error || "Error al eliminar la TAR");
        }
      } catch {
        setError("Error inesperado al eliminar la TAR");
      }
    });
  };

  // Truncate description for display
  const displayDescription =
    tarDescription.length > 100
      ? tarDescription.substring(0, 100) + "..."
      : tarDescription;

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
          Confirmar eliminacion
        </h3>

        <p className="text-sm text-gray-600 mb-4">
          Estas seguro de que quieres eliminar la TAR &ldquo;
          <strong>{displayDescription}</strong>&rdquo;? Esta accion no se puede
          deshacer y se eliminaran tambien todas las actividades asociadas.
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
