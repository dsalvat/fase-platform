"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getAIBigRockProposals,
  createBigRocksFromProposals,
} from "@/app/actions/ai-generation";
import type { BigRockProposal } from "@/lib/ai-generation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FaseCategoryBadge } from "@/components/big-rocks/fase-category-badge";
import { Bot, Loader2, Check, ListChecks, AlertCircle, RefreshCw, Info } from "lucide-react";

interface MonthOption {
  value: string;
  label: string;
}

interface AIProposalsDialogProps {
  monthOptions: MonthOption[];
  defaultMonth: string;
  hasAIContext: boolean;
  translations: {
    buttonLabel: string;
    confirmTitle: string;
    confirmDescription: string;
    confirmButton: string;
    cancel: string;
    dialogTitle: string;
    dialogDescription: string;
    generating: string;
    retry: string;
    regenerate: string;
    selectedCount: string;
    creating: string;
    createDrafts: string;
    targetMonth: string;
    contextMissing: string;
    contextMissingLink: string;
    contextUpdate: string;
    contextUpdateLink: string;
  };
}

export function AIProposalsDialog({
  monthOptions,
  defaultMonth,
  hasAIContext,
  translations: t,
}: AIProposalsDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"confirm" | "proposals">("confirm");
  const [targetMonth, setTargetMonth] = useState(defaultMonth);
  const [proposals, setProposals] = useState<BigRockProposal[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [creating, startCreating] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const selectedMonthLabel =
    monthOptions.find((m) => m.value === targetMonth)?.label || targetMonth;

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setStep("confirm");
      setTargetMonth(defaultMonth);
    } else {
      setStep("confirm");
      setProposals([]);
      setSelected(new Set());
      setError(null);
    }
  };

  const handleConfirmAndGenerate = async () => {
    setStep("proposals");
    await loadProposals();
  };

  const loadProposals = async () => {
    setLoading(true);
    setError(null);
    setProposals([]);
    setSelected(new Set());

    const result = await getAIBigRockProposals(targetMonth);

    if (result.success && result.proposals) {
      setProposals(result.proposals);
      setSelected(new Set(result.proposals.map((_, i) => i)));
    } else {
      setError(result.error || "Error desconocido");
    }
    setLoading(false);
  };

  const toggleSelect = (index: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const handleCreate = () => {
    const selectedProposals = proposals.filter((_, i) => selected.has(i));
    if (selectedProposals.length === 0) return;

    startCreating(async () => {
      const result = await createBigRocksFromProposals(targetMonth, selectedProposals);
      if (result.success) {
        setOpen(false);
        router.refresh();
      } else {
        setError(result.error || "Error al crear");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Bot className="h-4 w-4 mr-2" />
          {t.buttonLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        {/* Step 1: Confirmation */}
        {step === "confirm" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                {t.confirmTitle}
              </DialogTitle>
              <DialogDescription>
                {t.confirmDescription}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Month selector */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t.targetMonth}</label>
                <select
                  value={targetMonth}
                  onChange={(e) => setTargetMonth(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {monthOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* AI Context status */}
              {!hasAIContext ? (
                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                  <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                  <div className="text-sm">
                    <p className="text-amber-800 dark:text-amber-200">
                      {t.contextMissing}
                    </p>
                    <Link
                      href="/perfil"
                      className="text-amber-700 dark:text-amber-300 underline hover:no-underline text-xs"
                    >
                      {t.contextMissingLink}
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                  <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                  <div className="text-sm">
                    <p className="text-blue-800 dark:text-blue-200">
                      {t.contextUpdate}
                    </p>
                    <Link
                      href="/perfil"
                      className="text-blue-700 dark:text-blue-300 underline hover:no-underline text-xs"
                    >
                      {t.contextUpdateLink}
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="flex-row gap-2 sm:justify-end">
              <Button variant="outline" onClick={() => setOpen(false)}>
                {t.cancel}
              </Button>
              <Button onClick={handleConfirmAndGenerate}>
                <Bot className="h-4 w-4 mr-2" />
                {t.confirmButton}
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Step 2: Proposals */}
        {step === "proposals" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                {t.dialogTitle}
              </DialogTitle>
              <DialogDescription>
                {t.dialogDescription.replace("{month}", selectedMonthLabel)}
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto space-y-3 py-2">
              {loading && (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {t.generating}
                  </p>
                </div>
              )}

              {error && !loading && (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <AlertCircle className="h-8 w-8 text-red-500" />
                  <p className="text-sm text-red-600">{error}</p>
                  <Button variant="outline" size="sm" onClick={loadProposals}>
                    <RefreshCw className="h-4 w-4 mr-1" />
                    {t.retry}
                  </Button>
                </div>
              )}

              {!loading && !error && proposals.length > 0 && (
                <>
                  {proposals.map((proposal, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => toggleSelect(index)}
                      className={`w-full text-left p-4 rounded-lg border transition-colors ${
                        selected.has(index)
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-border bg-card hover:border-muted-foreground/30"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                            selected.has(index)
                              ? "border-blue-500 bg-blue-500 text-white"
                              : "border-muted-foreground/30"
                          }`}
                        >
                          {selected.has(index) && (
                            <Check className="h-3.5 w-3.5" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-medium text-sm text-foreground">
                              {proposal.title}
                            </h4>
                            {proposal.category && (
                              <FaseCategoryBadge
                                category={proposal.category}
                                size="sm"
                              />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {proposal.description}
                          </p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span>KPI: {proposal.indicator}</span>
                            <span>{proposal.numTars} TARs</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </>
              )}
            </div>

            {!loading && proposals.length > 0 && (
              <DialogFooter className="flex-row gap-2 sm:justify-between">
                <p className="text-xs text-muted-foreground self-center">
                  {t.selectedCount
                    .replace("{selected}", String(selected.size))
                    .replace("{total}", String(proposals.length))}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadProposals}
                    disabled={creating}
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    {t.regenerate}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleCreate}
                    disabled={selected.size === 0 || creating}
                  >
                    {creating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        {t.creating}
                      </>
                    ) : (
                      <>
                        <ListChecks className="h-4 w-4 mr-1" />
                        {t.createDrafts.replace("{count}", String(selected.size))}
                      </>
                    )}
                  </Button>
                </div>
              </DialogFooter>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
