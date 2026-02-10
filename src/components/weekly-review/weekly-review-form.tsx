"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { createWeeklyReview, updateWeeklyReview } from "@/app/actions/weekly-review";
import { CheckCircle, Loader2 } from "lucide-react";

interface WeeklyReviewFormProps {
  week: string;
  existingReview?: {
    id: string;
    accomplishments: string;
    blockers: string;
    learnings: string;
    nextWeekFocus: string;
  };
  translations: {
    accomplishments: string;
    accomplishmentsPlaceholder: string;
    blockers: string;
    blockersPlaceholder: string;
    learnings: string;
    learningsPlaceholder: string;
    nextWeekFocus: string;
    nextWeekFocusPlaceholder: string;
    submit: string;
    update: string;
    submitting: string;
    success: string;
    error: string;
    required: string;
  };
}

export function WeeklyReviewForm({
  week,
  existingReview,
  translations: t,
}: WeeklyReviewFormProps) {
  const [accomplishments, setAccomplishments] = useState(
    existingReview?.accomplishments || ""
  );
  const [blockers, setBlockers] = useState(existingReview?.blockers || "");
  const [learnings, setLearnings] = useState(existingReview?.learnings || "");
  const [nextWeekFocus, setNextWeekFocus] = useState(
    existingReview?.nextWeekFocus || ""
  );
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const isEditing = !!existingReview;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!accomplishments.trim() || !blockers.trim()) {
      setStatus("error");
      setErrorMsg(t.required);
      return;
    }

    startTransition(async () => {
      let result;
      if (isEditing) {
        result = await updateWeeklyReview(existingReview.id, {
          accomplishments: accomplishments.trim(),
          blockers: blockers.trim(),
          learnings: learnings.trim(),
          nextWeekFocus: nextWeekFocus.trim(),
        });
      } else {
        result = await createWeeklyReview({
          week,
          accomplishments: accomplishments.trim(),
          blockers: blockers.trim(),
          learnings: learnings.trim(),
          nextWeekFocus: nextWeekFocus.trim(),
        });
      }

      if (result.success) {
        setStatus("success");
        setTimeout(() => setStatus("idle"), 3000);
      } else {
        setStatus("error");
        setErrorMsg(result.error || t.error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Accomplishments (required) */}
      <div className="space-y-2">
        <label className="text-sm font-medium">{t.accomplishments} *</label>
        <Textarea
          value={accomplishments}
          onChange={(e) => {
            setAccomplishments(e.target.value);
            setStatus("idle");
          }}
          placeholder={t.accomplishmentsPlaceholder}
          rows={3}
          maxLength={5000}
        />
      </div>

      {/* Blockers (required) */}
      <div className="space-y-2">
        <label className="text-sm font-medium">{t.blockers} *</label>
        <Textarea
          value={blockers}
          onChange={(e) => {
            setBlockers(e.target.value);
            setStatus("idle");
          }}
          placeholder={t.blockersPlaceholder}
          rows={3}
          maxLength={5000}
        />
      </div>

      {/* Learnings (optional) */}
      <div className="space-y-2">
        <label className="text-sm font-medium">{t.learnings}</label>
        <Textarea
          value={learnings}
          onChange={(e) => setLearnings(e.target.value)}
          placeholder={t.learningsPlaceholder}
          rows={2}
          maxLength={5000}
        />
      </div>

      {/* Next Week Focus (optional) */}
      <div className="space-y-2">
        <label className="text-sm font-medium">{t.nextWeekFocus}</label>
        <Textarea
          value={nextWeekFocus}
          onChange={(e) => setNextWeekFocus(e.target.value)}
          placeholder={t.nextWeekFocusPlaceholder}
          rows={2}
          maxLength={5000}
        />
      </div>

      {/* Status + Submit */}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {t.submitting}
            </>
          ) : isEditing ? (
            t.update
          ) : (
            t.submit
          )}
        </Button>

        {status === "success" && (
          <span className="text-sm text-green-600 flex items-center gap-1">
            <CheckCircle className="h-4 w-4" />
            {t.success}
          </span>
        )}

        {status === "error" && (
          <span className="text-sm text-red-600">{errorMsg}</span>
        )}
      </div>
    </form>
  );
}
