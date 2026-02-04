import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { authOptions } from "@/lib/auth-options";
import { getCompanies } from "@/app/actions/companies";
import { UserRole } from "@prisma/client";
import { CompanyList, CreateCompanyDialog } from "@/components/admin";
import { Building2 } from "lucide-react";

export default async function AdminEmpresasPage() {
  const session = await getServerSession(authOptions);
  const userRole = session?.user?.role;
  const t = await getTranslations("companies");
  const tCommon = await getTranslations("common");

  // Only SUPERADMIN can access this page
  if (userRole !== UserRole.SUPERADMIN) {
    redirect("/unauthorized");
  }

  const companies = await getCompanies();

  const stats = {
    total: companies.length,
    totalUsers: companies.reduce((sum, c) => sum + c._count.userCompanies, 0),
  };

  // Prepare translations for client components
  const companyListTranslations = {
    name: t("name"),
    slug: t("slug"),
    users: t("users"),
    deleteConfirm: t("deleteConfirm"),
    noResults: tCommon("noResults"),
    edit: t("edit"),
    logo: t("logo"),
    logoUrl: t("logoUrl"),
    logoHelp: t("logoHelp"),
    save: tCommon("save"),
    cancel: tCommon("cancel"),
    saving: tCommon("loading"),
  };

  const createDialogTranslations = {
    new: t("new"),
    name: t("name"),
    slug: t("slug"),
    slugHelp: t("slugHelp"),
    cancel: tCommon("cancel"),
    create: tCommon("create"),
    loading: tCommon("loading"),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Building2 className="w-6 h-6 text-blue-700" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t("title")}</h1>
            <p className="text-muted-foreground">{t("subtitle")}</p>
          </div>
        </div>
        <CreateCompanyDialog translations={createDialogTranslations} />
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label={t("stats.total")} value={stats.total} color="blue" />
        <StatCard label={t("stats.totalUsers")} value={stats.totalUsers} color="green" />
      </div>

      {/* Company List */}
      <CompanyList companies={companies} translations={companyListTranslations} />
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "blue" | "green";
}) {
  const colors = {
    blue: "bg-blue-50 border-blue-200",
    green: "bg-green-50 border-green-200",
  };

  return (
    <div className={`p-4 rounded-lg border ${colors[color]}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
