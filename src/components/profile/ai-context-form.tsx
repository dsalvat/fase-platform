"use client";

import { useState, useTransition } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Check, AlertCircle } from "lucide-react";
import { updateAIContext } from "@/app/actions/profile";

interface AIContextFormProps {
  data: {
    contextRole: string | null;
    contextResponsibilities: string | null;
    contextObjectives: string | null;
    contextYearPriorities: string | null;
  };
  translations: {
    role: string;
    rolePlaceholder: string;
    responsibilities: string;
    responsibilitiesPlaceholder: string;
    objectives: string;
    objectivesPlaceholder: string;
    yearPriorities: string;
    yearPrioritiesPlaceholder: string;
    save: string;
    saving: string;
    saved: string;
    error: string;
  };
}

export function AIContextForm({ data, translations: t }: AIContextFormProps) {
  const [contextRole, setContextRole] = useState(data.contextRole || "");
  const [contextResponsibilities, setContextResponsibilities] = useState(
    data.contextResponsibilities || ""
  );
  const [contextObjectives, setContextObjectives] = useState(
    data.contextObjectives || ""
  );
  const [contextYearPriorities, setContextYearPriorities] = useState(
    data.contextYearPriorities || ""
  );
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("idle");
    setErrorMessage(null);

    startTransition(async () => {
      const result = await updateAIContext({
        contextRole: contextRole || null,
        contextResponsibilities: contextResponsibilities || null,
        contextObjectives: contextObjectives || null,
        contextYearPriorities: contextYearPriorities || null,
      });

      if (result.success) {
        setStatus("success");
        setTimeout(() => setStatus("idle"), 3000);
      } else {
        setStatus("error");
        setErrorMessage(result.error || t.error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="contextRole">{t.role}</Label>
        <Textarea
          id="contextRole"
          value={contextRole}
          onChange={(e) => setContextRole(e.target.value)}
          placeholder={t.rolePlaceholder}
          disabled={isPending}
          maxLength={500}
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="contextResponsibilities">{t.responsibilities}</Label>
        <Textarea
          id="contextResponsibilities"
          value={contextResponsibilities}
          onChange={(e) => setContextResponsibilities(e.target.value)}
          placeholder={t.responsibilitiesPlaceholder}
          disabled={isPending}
          maxLength={2000}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="contextObjectives">{t.objectives}</Label>
        <Textarea
          id="contextObjectives"
          value={contextObjectives}
          onChange={(e) => setContextObjectives(e.target.value)}
          placeholder={t.objectivesPlaceholder}
          disabled={isPending}
          maxLength={2000}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="contextYearPriorities">{t.yearPriorities}</Label>
        <Textarea
          id="contextYearPriorities"
          value={contextYearPriorities}
          onChange={(e) => setContextYearPriorities(e.target.value)}
          placeholder={t.yearPrioritiesPlaceholder}
          disabled={isPending}
          maxLength={2000}
          rows={3}
        />
      </div>

      {status === "error" && errorMessage && (
        <div className="flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="h-4 w-4" />
          {errorMessage}
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {t.saving}
            </>
          ) : (
            t.save
          )}
        </Button>
        {status === "success" && (
          <span className="flex items-center gap-1 text-green-600 text-sm">
            <Check className="h-4 w-4" />
            {t.saved}
          </span>
        )}
      </div>
    </form>
  );
}
