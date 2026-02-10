import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, AlertCircle, Lightbulb, Target } from "lucide-react";

interface WeeklyReviewDisplayProps {
  review: {
    accomplishments: string;
    blockers: string;
    learnings: string;
    nextWeekFocus: string;
    createdAt: Date;
  };
  translations: {
    accomplishments: string;
    blockers: string;
    learnings: string;
    nextWeekFocus: string;
    completedAt: string;
  };
}

export function WeeklyReviewDisplay({
  review,
  translations: t,
}: WeeklyReviewDisplayProps) {
  const sections = [
    {
      title: t.accomplishments,
      content: review.accomplishments,
      icon: CheckCircle2,
      iconColor: "text-green-600",
    },
    {
      title: t.blockers,
      content: review.blockers,
      icon: AlertCircle,
      iconColor: "text-amber-600",
    },
    {
      title: t.learnings,
      content: review.learnings,
      icon: Lightbulb,
      iconColor: "text-blue-600",
      optional: true,
    },
    {
      title: t.nextWeekFocus,
      content: review.nextWeekFocus,
      icon: Target,
      iconColor: "text-purple-600",
      optional: true,
    },
  ];

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        {t.completedAt}{" "}
        {review.createdAt.toLocaleDateString("es-ES", {
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>

      <div className="grid gap-3 md:grid-cols-2">
        {sections.map((section) => {
          if (section.optional && !section.content) return null;
          const Icon = section.icon;
          return (
            <Card key={section.title}>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${section.iconColor}`} />
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4 px-4">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {section.content}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
