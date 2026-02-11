"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { confirmBigRock } from "@/app/actions/big-rocks";
import { estimateBigRockEvaluationTokens } from "@/app/actions/ai-estimation";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CheckCircle, Loader2, Cpu } from "lucide-react";

interface BigRockConfirmButtonProps {
  bigRockId: string;
  bigRockTitle: string;
}

export function BigRockConfirmButton({
  bigRockId,
  bigRockTitle,
}: BigRockConfirmButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [tokenEstimate, setTokenEstimate] = useState<{ inputTokens: number; maxOutputTokens: number } | null>(null);
  const [estimatingTokens, setEstimatingTokens] = useState(false);

  useEffect(() => {
    if (open) {
      setEstimatingTokens(true);
      estimateBigRockEvaluationTokens(bigRockId).then((res) => {
        if (res.success && res.estimate) {
          setTokenEstimate(res.estimate);
        }
        setEstimatingTokens(false);
      });
    } else {
      setTokenEstimate(null);
    }
  }, [open, bigRockId]);

  const handleConfirm = () => {
    setError(null);
    startTransition(async () => {
      const result = await confirmBigRock(bigRockId);

      if (result.success) {
        setOpen(false);
        router.refresh();
      } else {
        setError(result.error || "Error al confirmar");
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="outline" className="border-green-500 text-green-700 hover:bg-green-50">
          <CheckCircle className="h-4 w-4 mr-2" />
          Confirmar
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Big Rock</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                ¿Estás seguro de que quieres confirmar <strong>&quot;{bigRockTitle}&quot;</strong>?
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-800 text-sm">
                <p className="font-medium mb-1">Una vez confirmado:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>No podrás editar el título, descripción, categoría ni indicador</li>
                  <li>Solo podrás gestionar TARs, Reuniones Clave y Personas Clave</li>
                  <li>Esta acción no se puede deshacer</li>
                </ul>
              </div>
              {/* Token estimate */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
                <Cpu className="h-3.5 w-3.5 shrink-0" />
                {estimatingTokens ? (
                  <span className="flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Estimando consumo de tokens...
                  </span>
                ) : tokenEstimate ? (
                  <span>
                    Evaluación IA: ~{tokenEstimate.inputTokens.toLocaleString()} tokens entrada + {tokenEstimate.maxOutputTokens.toLocaleString()} tokens salida (máx.)
                  </span>
                ) : (
                  <span>No se pudo estimar el consumo de tokens</span>
                )}
              </div>
              {error && (
                <p className="text-red-600 text-sm">{error}</p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            disabled={isPending}
            className="bg-green-600 hover:bg-green-700"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Confirmando...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirmar Big Rock
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
