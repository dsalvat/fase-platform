import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { getCurrentCompanyId } from "@/lib/company-context";
import { KeyPersonList } from "@/components/key-people";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Users } from "lucide-react";

/**
 * Key People list page
 * Server Component that fetches and displays all Key People for the company
 */
export default async function KeyPeoplePage() {
  await requireAuth();
  const t = await getTranslations("keyPeople");
  const companyId = await getCurrentCompanyId();

  // Fetch Key People for the company (shared across all users)
  const keyPeople = await prisma.keyPerson.findMany({
    where: companyId ? { companyId } : {},
    include: {
      _count: {
        select: {
          bigRocks: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Calculate stats
  const totalPeople = keyPeople.length;
  const linkedPeople = keyPeople.filter((p) => p._count.bigRocks > 0).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>

        <Link href="/key-people/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            {t("new")}
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t("summary")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{totalPeople}</p>
              <p className="text-sm text-muted-foreground">{t("totalPeople")}</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{linkedPeople}</p>
              <p className="text-sm text-muted-foreground">{t("linkedToTars")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key People List */}
      <Card>
        <CardHeader>
          <CardTitle>{t("people")} ({totalPeople})</CardTitle>
        </CardHeader>
        <CardContent>
          <KeyPersonList keyPeople={keyPeople} />
        </CardContent>
      </Card>
    </div>
  );
}
