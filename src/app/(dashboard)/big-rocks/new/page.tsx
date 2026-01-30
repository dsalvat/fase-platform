import { BigRockForm } from "@/components/big-rocks/big-rock-form";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { getNextMonth, getCurrentMonth } from "@/lib/month-helpers";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { getCurrentCompanyId } from "@/lib/company-context";

interface PageProps {
  searchParams: Promise<{
    month?: string;
  }>;
}

/**
 * Create Big Rock page
 * Server Component that renders the create form
 */
export default async function NewBigRockPage({ searchParams }: PageProps) {
  const { month } = await searchParams;
  const defaultMonth = month || getNextMonth(getCurrentMonth());
  const t = await getTranslations("bigRocks");
  await requireAuth();

  // Get current company
  const companyId = await getCurrentCompanyId();

  // Fetch available key people for the company (shared across all users)
  const availableKeyPeople = await prisma.keyPerson.findMany({
    where: companyId ? { companyId } : {},
    orderBy: { firstName: "asc" },
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/big-rocks">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("backToList")}
          </Button>
        </Link>
      </div>

      {/* Form */}
      <BigRockForm
        mode="create"
        defaultMonth={defaultMonth}
        availableKeyPeople={availableKeyPeople}
      />
    </div>
  );
}
