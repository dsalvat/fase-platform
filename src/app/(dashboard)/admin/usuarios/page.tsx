import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { getCurrentCompanyId, isSuperAdmin } from "@/lib/company-context";
import { UserRole, UserStatus } from "@prisma/client";
import { UserList, InviteUserDialog } from "@/components/admin";
import { Shield } from "lucide-react";

async function getUsers(companyId: string | null, isSuperAdmin: boolean) {
  // SUPERADMIN without company selected sees all users
  // SUPERADMIN with company selected sees only that company's users
  // ADMIN sees only their company's users
  const whereClause = isSuperAdmin
    ? companyId
      ? { companies: { some: { companyId } } }
      : {} // Show all if no company selected
    : companyId
      ? { companies: { some: { companyId } } }
      : {}; // Regular admin sees only their company

  const users = await prisma.user.findMany({
    where: whereClause,
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      role: true,
      status: true,
      createdAt: true,
      currentCompanyId: true,
      companies: {
        select: {
          company: {
            select: {
              id: true,
              name: true,
              logo: true,
            },
          },
        },
      },
      apps: {
        select: {
          appId: true,
          app: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
        },
      },
      supervisor: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      _count: {
        select: {
          supervisees: true,
        },
      },
    },
    orderBy: [
      { role: "desc" }, // ADMIN first, then SUPERVISOR, then USER
      { createdAt: "desc" },
    ],
  });

  // Transform companies structure for the UI
  return users.map((user) => ({
    ...user,
    company: user.companies[0]?.company || null,
    companies: user.companies.map((uc) => ({
      companyId: uc.company.id,
      company: uc.company,
    })),
    apps: user.apps.map((ua) => ({
      appId: ua.app.id,
      app: ua.app,
    })),
  }));
}

async function getCompanies() {
  return prisma.company.findMany({
    select: {
      id: true,
      name: true,
      logo: true,
    },
    orderBy: { name: "asc" },
  });
}

async function getApps() {
  return prisma.app.findMany({
    where: { isActive: true },
    select: {
      id: true,
      code: true,
      name: true,
    },
    orderBy: { name: "asc" },
  });
}

async function getAllUsersForSelector(companyId: string | null, isSuperAdmin: boolean) {
  const whereClause = isSuperAdmin
    ? companyId
      ? { companies: { some: { companyId } } }
      : {}
    : companyId
      ? { companies: { some: { companyId } } }
      : {};

  const users = await prisma.user.findMany({
    where: whereClause,
    select: {
      id: true,
      name: true,
      email: true,
    },
    orderBy: { name: "asc" },
  });

  return users;
}

export default async function AdminUsuariosPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const userRole = session?.user?.role || UserRole.USER;
  const t = await getTranslations("admin");
  const tCommon = await getTranslations("common");
  const tCompanies = await getTranslations("companies");

  // Only admins and superadmins can access this page
  if (userRole !== UserRole.ADMIN && userRole !== UserRole.SUPERADMIN) {
    redirect("/unauthorized");
  }

  const companyId = await getCurrentCompanyId();
  const superAdmin = await isSuperAdmin();

  const [users, allUsers, companies, apps] = await Promise.all([
    getUsers(companyId, superAdmin),
    getAllUsersForSelector(companyId, superAdmin),
    superAdmin ? getCompanies() : Promise.resolve([]),
    getApps(),
  ]);

  const stats = {
    total: users.length,
    admins: users.filter((u) => u.role === "ADMIN").length,
    supervisors: users.filter((u) => u.role === "SUPERVISOR").length,
    users: users.filter((u) => u.role === "USER").length,
    invited: users.filter((u) => u.status === UserStatus.INVITED).length,
    active: users.filter((u) => u.status === UserStatus.ACTIVE).length,
    deactivated: users.filter((u) => u.status === UserStatus.DEACTIVATED).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
            <Shield className="w-6 h-6 text-purple-700 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t("title")}</h1>
            <p className="text-muted-foreground">{t("subtitle")}</p>
          </div>
        </div>
        <InviteUserDialog potentialSupervisors={allUsers} />
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4 lg:grid-cols-7">
        <StatCard label={t("total")} value={stats.total} color="gray" />
        <StatCard label={t("admins")} value={stats.admins} color="purple" />
        <StatCard label={t("supervisors")} value={stats.supervisors} color="blue" />
        <StatCard label={t("users")} value={stats.users} color="green" />
        <StatCard label={t("invited")} value={stats.invited} color="amber" />
        <StatCard label={t("active")} value={stats.active} color="emerald" />
        <StatCard label={t("deactivated")} value={stats.deactivated} color="red" />
      </div>

      {/* User List */}
      <UserList
        users={users}
        allUsers={allUsers}
        currentUserId={userId || ""}
        companies={companies}
        apps={apps}
        isSuperAdmin={superAdmin}
        translations={{
          hideDeactivated: t("hideDeactivated"),
          showingUsersTemplate: t("showingUsersTemplate"),
          noResults: tCommon("noResults"),
          you: t("you"),
          noName: t("noName"),
          role: t("role"),
          status: t("status"),
          supervisor: t("supervisor"),
          company: tCompanies("name"),
          apps: t("apps"),
          cannotChangeOwnRole: t("cannotChangeOwnRole"),
          cannotChangeOwnStatus: t("cannotChangeOwnStatus"),
          registeredOn: t("registeredOn"),
          edit: tCommon("edit"),
          close: tCommon("close"),
          noCompany: tCompanies("noCompanySelected"),
          noApp: t("noApp"),
          saving: tCommon("loading"),
          viewBigRocks: t("viewBigRocks"),
        }}
      />
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
  color: "gray" | "purple" | "blue" | "green" | "amber" | "emerald" | "red";
}) {
  const colors = {
    gray: "bg-gray-50 border-gray-200 dark:bg-gray-800/50 dark:border-gray-700",
    purple: "bg-purple-50 border-purple-200 dark:bg-purple-900/30 dark:border-purple-800",
    blue: "bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800",
    green: "bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-800",
    amber: "bg-amber-50 border-amber-200 dark:bg-amber-900/30 dark:border-amber-800",
    emerald: "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800",
    red: "bg-red-50 border-red-200 dark:bg-red-900/30 dark:border-red-800",
  };

  return (
    <div className={`p-4 rounded-lg border ${colors[color]}`}>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
