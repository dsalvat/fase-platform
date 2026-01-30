"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createFeedback } from "@/app/actions/feedback";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Loader2, Star } from "lucide-react";
import { FeedbackTargetType } from "@prisma/client";
import type { FeedbackWithSupervisor } from "@/types/feedback";

interface FeedbackFormTranslations {
  bigRockFeedback: string;
  monthFeedback: string;
  editFeedback: string;
  giveFeedback: string;
  comment: string;
  commentPlaceholder: string;
  ratingOptional: string;
  submitFeedback: string;
  cancel: string;
  clear: string;
}

interface FeedbackFormProps {
  targetType: FeedbackTargetType;
  targetId: string;
  existingFeedback?: FeedbackWithSupervisor | null;
  onSuccess?: () => void;
  compact?: boolean;
  translations?: FeedbackFormTranslations;
}

// Default translations (Spanish)
const defaultTranslations: FeedbackFormTranslations = {
  bigRockFeedback: "Feedback del Big Rock",
  monthFeedback: "Feedback General del Mes",
  editFeedback: "Editar Feedback",
  giveFeedback: "Dar Feedback",
  comment: "Comentario",
  commentPlaceholder: "Escribe tu feedback aqui...",
  ratingOptional: "Valoracion (opcional)",
  submitFeedback: "Enviar Feedback",
  cancel: "Cancelar",
  clear: "Limpiar",
};

export function FeedbackForm({
  targetType,
  targetId,
  existingFeedback,
  onSuccess,
  compact = false,
  translations,
}: FeedbackFormProps) {
  const t = translations || defaultTranslations;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [comment, setComment] = useState(existingFeedback?.comment || "");
  const [rating, setRating] = useState<number | undefined>(
    existingFeedback?.rating ?? undefined
  );
  const [isEditing, setIsEditing] = useState(!existingFeedback);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!comment.trim()) {
      setError("El comentario es requerido");
      return;
    }

    startTransition(async () => {
      const result = await createFeedback(targetType, targetId, comment, rating);

      if (result.success) {
        setIsEditing(false);
        router.refresh();
        onSuccess?.();
      } else {
        setError(result.error || "Error al guardar");
      }
    });
  };

  const title =
    targetType === "BIG_ROCK" ? t.bigRockFeedback : t.monthFeedback;

  // Display mode (existing feedback, not editing)
  if (existingFeedback && !isEditing) {
    return (
      <Card className={compact ? "border-0 shadow-none" : ""}>
        {!compact && (
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              {title}
            </CardTitle>
          </CardHeader>
        )}
        <CardContent className={compact ? "p-0" : ""}>
          <div className="space-y-2">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {existingFeedback.comment}
            </p>
            {existingFeedback.rating && (
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= existingFeedback.rating!
                        ? "text-yellow-500 fill-yellow-500"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
            )}
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-gray-500">
                {existingFeedback.supervisor.name} -{" "}
                {new Date(existingFeedback.updatedAt).toLocaleDateString()}
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditing(true)}
              >
                {t.editFeedback}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Edit/Create mode
  return (
    <Card className={compact ? "border-0 shadow-none" : ""}>
      {!compact && (
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            {existingFeedback ? t.editFeedback : t.giveFeedback}
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className={compact ? "p-0" : ""}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="comment">{t.comment}</Label>
            <textarea
              id="comment"
              className="w-full min-h-[100px] px-3 py-2 border rounded-md text-sm resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t.commentPlaceholder}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label>{t.ratingOptional}</Label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(rating === star ? undefined : star)}
                  className="p-1 hover:scale-110 transition-transform"
                  disabled={isPending}
                >
                  <Star
                    className={`h-6 w-6 ${
                      rating && star <= rating
                        ? "text-yellow-500 fill-yellow-500"
                        : "text-gray-300 hover:text-yellow-400"
                    }`}
                  />
                </button>
              ))}
              {rating && (
                <button
                  type="button"
                  onClick={() => setRating(undefined)}
                  className="ml-2 text-xs text-gray-500 hover:text-gray-700"
                >
                  {t.clear}
                </button>
              )}
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex items-center gap-2 justify-end">
            {existingFeedback && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setComment(existingFeedback.comment);
                  setRating(existingFeedback.rating ?? undefined);
                  setIsEditing(false);
                }}
                disabled={isPending}
              >
                {t.cancel}
              </Button>
            )}
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                t.submitFeedback
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
