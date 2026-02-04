import { Suspense } from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { BigRockList } from "@/components/big-rocks/big-rock-list";
import { MonthSelector } from "@/components/big-rocks/month-selector";
import { MonthPlanningStatus } from "@/components/planning";
import { getMonthPlanningStatus } from "@/app/actions/planning";
import { requireAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { getCurrentMonth, isMonthReadOnly } from "@/lib/month-helpers";
import { UserRole } from "@prisma/client";

// Force dynamic rendering to avoid stale translations
export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    month?: string;
  }>;
}

/**
 * Big Rocks list page with month filtering
 * Server Component that renders the list of Big Rocks
 */
export default async function BigRocksPage({ searchParams }: PageProps) {
  const { month } = await searchParams;
  const defaultMonth = getCurrentMonth();
  const displayMonth = month || defaultMonth;
  const isReadOnly = isMonthReadOnly(displayMonth);

  const t = await getTranslations("bigRocks");
  const tCommon = await getTranslations("common");
  const tPlanning = await getTranslations("planning");

  // Get user role to check if can unconfirm
  const user = await requireAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userRole = (user as any).role as UserRole;
  const canUnconfirm = userRole === "ADMIN" || userRole === "SUPERADMIN";

  // Get planning status for the current month
  const planningStatus = await getMonthPlanningStatus(displayMonth);

  // Translations for the client component
  // For planningConfirmedOn, we pass a placeholder that will be replaced in the client
  const planningTranslations = {
    noBigRocks: tPlanning("noBigRocks"),
    confirmed: tPlanning("confirmed"),
    planningConfirmedOn: tPlanning("planningConfirmedOn", { date: "__DATE__" }),
    notConfirmed: tPlanning("notConfirmed"),
    bigRocksProgress: tPlanning("bigRocksProgress"),
    confirmPlanning: tPlanning("confirmPlanning"),
    confirmPlanningTitle: tPlanning("confirmPlanningTitle"),
    confirmPlanningDescription: tPlanning("confirmPlanningDescription"),
    allBigRocksRequired: tPlanning("allBigRocksRequired"),
    cancel: tCommon("cancel"),
    unconfirmPlanning: tPlanning("unconfirmPlanning"),
    unconfirmPlanningTitle: tPlanning("unconfirmPlanningTitle"),
    unconfirmPlanningDescription: tPlanning("unconfirmPlanningDescription"),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t("title")}</h1>
          <p className="text-muted-foreground mt-1">
            {t("subtitle")}
          </p>
        </div>

        {!isReadOnly && (
          <Link href={`/big-rocks/new?month=${displayMonth}`} data-tour="new-big-rock-button">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {t("new")}
            </Button>
          </Link>
        )}
      </div>

      {/* Month selector and planning status */}
      <div className="flex flex-col gap-4">
        <MonthSelector defaultMonth={defaultMonth} />

        {/* Planning status - show for current or future months */}
        {!isReadOnly && (
          <MonthPlanningStatus
            status={planningStatus}
            translations={planningTranslations}
            canUnconfirm={canUnconfirm}
          />
        )}

        {isReadOnly && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3">
            <div className="flex items-center gap-2">
              <svg
                className="h-5 w-5 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  {t("readOnlyMonth")}
                </p>
                <p className="text-xs text-yellow-700">
                  {t("readOnlyMonthDesc")}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Big Rocks list */}
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-muted-foreground">{tCommon("loading")}</span>
          </div>
        }
      >
        <BigRockList month={displayMonth} />
      </Suspense>
    </div>
  );
}
