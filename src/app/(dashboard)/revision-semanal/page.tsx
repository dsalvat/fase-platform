import { getTranslations } from "next-intl/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getCurrentCompanyId } from "@/lib/company-context";
import { getCurrentWeek, formatWeekLabel, getDaysInWeek } from "@/lib/month-helpers";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardCheck, ChevronLeft, ChevronRight, Pencil } from "lucide-react";
import { WeeklyReviewForm } from "@/components/weekly-review/weekly-review-form";
import { WeeklyReviewDisplay } from "@/components/weekly-review/weekly-review-display";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface PageProps {
  searchParams: Promise<{ week?: string; edit?: string }>;
}

function getAdjacentWeek(week: string, direction: "prev" | "next"): string {
  const [yearStr, weekStr] = week.split("-W");
  let year = parseInt(yearStr);
  let weekNum = parseInt(weekStr);

  if (direction === "prev") {
    weekNum--;
    if (weekNum < 1) {
      year--;
      weekNum = 52;
    }
  } else {
    weekNum++;
    if (weekNum > 52) {
      year++;
      weekNum = 1;
    }
  }

  return `${year}-W${String(weekNum).padStart(2, "0")}`;
}

export default async function WeeklyReviewPage({ searchParams }: PageProps) {
  const user = await requireAuth();
  const companyId = await getCurrentCompanyId();
  const t = await getTranslations("weeklyReview");
  const tCommon = await getTranslations("common");

  const params = await searchParams;
  const currentWeek = getCurrentWeek();
  const selectedWeek = params.week || currentWeek;
  const isCurrentWeek = selectedWeek === currentWeek;

  // Get week dates for display
  const weekDays = getDaysInWeek(selectedWeek);
  const weekStart = weekDays[0];
  const weekEnd = weekDays[weekDays.length - 1];
  const weekLabel = weekStart && weekEnd
    ? `${format(weekStart, "d MMM", { locale: es })} - ${format(weekEnd, "d MMM yyyy", { locale: es })}`
    : formatWeekLabel(selectedWeek);

  // Get existing review
  let review = null;
  if (companyId) {
    review = await prisma.weeklyReview.findUnique({
      where: {
        userId_week_companyId: {
          userId: user.id,
          week: selectedWeek,
          companyId,
        },
      },
    });
  }

  const [, weekNumStr] = selectedWeek.split("-W");
  const weekNum = parseInt(weekNumStr);

  const prevWeek = getAdjacentWeek(selectedWeek, "prev");
  const nextWeek = getAdjacentWeek(selectedWeek, "next");

  // Don't allow navigating to future weeks
  const canGoNext = nextWeek <= currentWeek;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
          <ClipboardCheck className="w-6 h-6 text-emerald-700 dark:text-emerald-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <Link href={`/revision-semanal?week=${prevWeek}`}>
          <Button variant="outline" size="sm">
            <ChevronLeft className="h-4 w-4 mr-1" />
            {tCommon("previous")}
          </Button>
        </Link>

        <div className="text-center">
          <p className="font-semibold">
            {t("weekLabel", { num: weekNum })}
          </p>
          <p className="text-sm text-muted-foreground">{weekLabel}</p>
          {isCurrentWeek && (
            <span className="text-xs text-emerald-600 font-medium">
              {t("currentWeek")}
            </span>
          )}
        </div>

        {canGoNext ? (
          <Link href={`/revision-semanal?week=${nextWeek}`}>
            <Button variant="outline" size="sm">
              {tCommon("next")}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        ) : (
          <Button variant="outline" size="sm" disabled>
            {tCommon("next")}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>

      {/* Review Content */}
      <Card>
        <CardHeader>
          <CardTitle>
            {review ? t("reviewCompleted") : t("reviewPending")}
          </CardTitle>
          <CardDescription>
            {review ? t("reviewCompletedDesc") : t("reviewPendingDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {review && params.edit !== "true" ? (
            <div className="space-y-4">
              <WeeklyReviewDisplay
                review={review}
                translations={{
                  accomplishments: t("accomplishments"),
                  blockers: t("blockers"),
                  learnings: t("learnings"),
                  nextWeekFocus: t("nextWeekFocus"),
                  completedAt: t("completedAt"),
                }}
              />
              <Link href={`/revision-semanal?week=${selectedWeek}&edit=true`}>
                <Button variant="outline" size="sm" className="mt-3">
                  <Pencil className="h-4 w-4 mr-2" />
                  {tCommon("edit")}
                </Button>
              </Link>
            </div>
          ) : (
            <WeeklyReviewForm
              week={selectedWeek}
              existingReview={
                review
                  ? {
                      id: review.id,
                      accomplishments: review.accomplishments,
                      blockers: review.blockers,
                      learnings: review.learnings,
                      nextWeekFocus: review.nextWeekFocus,
                    }
                  : undefined
              }
              translations={{
                accomplishments: t("accomplishments"),
                accomplishmentsPlaceholder: t("accomplishmentsPlaceholder"),
                blockers: t("blockers"),
                blockersPlaceholder: t("blockersPlaceholder"),
                learnings: t("learnings"),
                learningsPlaceholder: t("learningsPlaceholder"),
                nextWeekFocus: t("nextWeekFocus"),
                nextWeekFocusPlaceholder: t("nextWeekFocusPlaceholder"),
                submit: t("submit"),
                update: t("update"),
                submitting: tCommon("loading"),
                success: t("success"),
                error: tCommon("error"),
                required: t("required"),
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
