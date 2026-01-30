"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Star, User } from "lucide-react";
import type { FeedbackWithSupervisor } from "@/types/feedback";

interface FeedbackDisplayTranslations {
  noFeedback: string;
  supervisorFeedback: string;
}

interface FeedbackDisplayProps {
  feedback: FeedbackWithSupervisor | null;
  showSupervisorName?: boolean;
  title?: string;
  translations?: FeedbackDisplayTranslations;
}

// Default translations (Spanish)
const defaultTranslations: FeedbackDisplayTranslations = {
  noFeedback: "Sin feedback todavia",
  supervisorFeedback: "Feedback del Supervisor",
};

export function FeedbackDisplay({
  feedback,
  showSupervisorName = true,
  title,
  translations,
}: FeedbackDisplayProps) {
  const t = translations || defaultTranslations;

  if (!feedback) {
    return (
      <Card className="bg-gray-50 border-dashed">
        <CardContent className="py-6">
          <div className="text-center text-gray-500">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{t.noFeedback}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-blue-50 border-blue-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2 text-blue-800">
          <MessageSquare className="h-4 w-4" />
          {title || t.supervisorFeedback}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-gray-700 whitespace-pre-wrap">
          {feedback.comment}
        </p>

        {feedback.rating && (
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-4 w-4 ${
                  star <= feedback.rating!
                    ? "text-yellow-500 fill-yellow-500"
                    : "text-gray-300"
                }`}
              />
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-blue-200">
          {showSupervisorName && (
            <div className="flex items-center gap-2 text-xs text-blue-600">
              <User className="h-3 w-3" />
              <span>{feedback.supervisor.name}</span>
            </div>
          )}
          <p className="text-xs text-blue-500">
            {new Date(feedback.updatedAt).toLocaleDateString()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
