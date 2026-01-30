import { getServerSession } from "next-auth";
import { getTranslations } from "next-intl/server";
import { authOptions } from "@/lib/auth-options";
import { UserRole } from "@prisma/client";
import { getActivityLogs, getViewableUsers } from "@/lib/activity-log";
import { ActivityTimeline } from "@/components/activity-log";

export default async function ActividadPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userRole = ((session?.user as any)?.role as UserRole) || "USER";
  const t = await getTranslations("activityLog");

  if (!userId) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">
          {t("loginRequired")}
        </p>
      </div>
    );
  }

  // Fetch initial data
  const [initialLogs, viewableUsers] = await Promise.all([
    getActivityLogs(userId, userRole, { page: 1, limit: 20 }),
    getViewableUsers(userId, userRole),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t("title")}</h1>
        <p className="text-gray-500 mt-1">
          {t("subtitle")}
        </p>
      </div>

      {/* Timeline */}
      <ActivityTimeline
        initialData={initialLogs}
        initialViewableUsers={viewableUsers}
        userRole={userRole}
      />
    </div>
  );
}
