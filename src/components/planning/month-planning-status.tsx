"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { confirmMonthPlanning, unconfirmMonthPlanning } from "@/app/actions/planning";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
import { CheckCircle, Loader2, ShieldCheck, Clock, XCircle } from "lucide-react";
import type { MonthPlanningStatus as MonthPlanningStatusType } from "@/types/feedback";

interface MonthPlanningStatusTranslations {
  noBigRocks: string;
  confirmed: string;
  planningConfirmedOn: string;
  notConfirmed: string;
  bigRocksProgress: string;
  confirmPlanning: string;
  confirmPlanningTitle: string;
  confirmPlanningDescription: string;
  allBigRocksRequired: string;
  cancel: string;
  unconfirmPlanning?: string;
  unconfirmPlanningTitle?: string;
  unconfirmPlanningDescription?: string;
}

interface MonthPlanningStatusProps {
  status: MonthPlanningStatusType;
  translations: MonthPlanningStatusTranslations;
  canUnconfirm?: boolean;
}

export function MonthPlanningStatus({ status, translations: t, canUnconfirm = false }: MonthPlanningStatusProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [unconfirmOpen, setUnconfirmOpen] = useState(false);

  const progress =
    status.totalBigRocks > 0
      ? Math.round((status.confirmedBigRocks / status.totalBigRocks) * 100)
      : 0;

  const handleConfirm = () => {
    setError(null);
    startTransition(async () => {
      const result = await confirmMonthPlanning(status.month);

      if (result.success) {
        setOpen(false);
        router.refresh();
      } else {
        setError(result.error || "Error al confirmar");
      }
    });
  };

  const handleUnconfirm = () => {
    setError(null);
    startTransition(async () => {
      const result = await unconfirmMonthPlanning(status.month);

      if (result.success) {
        setUnconfirmOpen(false);
        router.refresh();
      } else {
        setError(result.error || "Error al desconfirmar");
      }
    });
  };

  // No Big Rocks case
  if (status.totalBigRocks === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 sm:px-4 py-3">
        <div className="flex items-center gap-2 text-gray-600">
          <Clock className="h-5 w-5" />
          <span className="text-sm">{t.noBigRocks}</span>
        </div>
      </div>
    );
  }

  // Already confirmed
  if (status.isPlanningConfirmed) {
    return (
      <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg px-3 sm:px-4 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-green-800 dark:text-green-300 truncate">
                {t.confirmed}
              </p>
              {status.planningConfirmedAt && (
                <p className="text-xs text-green-600 dark:text-green-400">
                  {t.planningConfirmedOn.replace("__DATE__", new Date(status.planningConfirmedAt).toLocaleDateString())}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-sm text-green-700 dark:text-green-300">
              {status.confirmedBigRocks}/{status.totalBigRocks} Big Rocks
            </div>
            {canUnconfirm && (
              <AlertDialog open={unconfirmOpen} onOpenChange={setUnconfirmOpen}>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-400 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-500 dark:text-red-400 dark:hover:bg-red-900/50 dark:hover:text-red-300"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    {t.unconfirmPlanning || "Desconfirmar"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t.unconfirmPlanningTitle || "Desconfirmar Planificacion"}</AlertDialogTitle>
                    <AlertDialogDescription asChild>
                      <div className="space-y-3 text-sm text-muted-foreground">
                        <p>{t.unconfirmPlanningDescription || "Esto permitira al usuario volver a editar su planificacion."}</p>
                        {error && <p className="text-red-600 text-sm">{error}</p>}
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isPending}>
                      {t.cancel}
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={(e) => {
                        e.preventDefault();
                        handleUnconfirm();
                      }}
                      disabled={isPending}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Desconfirmando...
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 mr-2" />
                          {t.unconfirmPlanning || "Desconfirmar"}
                        </>
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Not yet confirmed - show progress
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 sm:px-4 py-3 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Clock className="h-5 w-5 text-blue-600 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-blue-800">
              {t.notConfirmed}
            </p>
            <p className="text-xs text-blue-600">
              {t.bigRocksProgress
                .replace("{confirmed}", String(status.confirmedBigRocks))
                .replace("{total}", String(status.totalBigRocks))}
            </p>
          </div>
        </div>

        <AlertDialog open={open} onOpenChange={setOpen}>
          <AlertDialogTrigger asChild>
            <Button
              size="sm"
              disabled={!status.canConfirmPlanning}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {t.confirmPlanning}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t.confirmPlanningTitle}</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>{t.confirmPlanningDescription}</p>
                  {error && <p className="text-red-600 text-sm">{error}</p>}
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isPending}>
                {t.cancel}
              </AlertDialogCancel>
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
                    {t.confirmPlanning}
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <Progress value={progress} className="h-2" />
        {!status.canConfirmPlanning && status.totalBigRocks > 0 && (
          <p className="text-xs text-blue-600">{t.allBigRocksRequired}</p>
        )}
      </div>
    </div>
  );
}
