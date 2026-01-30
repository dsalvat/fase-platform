import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { UserRole } from "@prisma/client";
import { getActivityLogs, getViewableUsers } from "@/lib/activity-log";
import { ActivityTimeline } from "@/components/activity-log";

export default async function ActividadPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userRole = ((session?.user as any)?.role as UserRole) || "USER";

  if (!userId) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">
          Debes iniciar sesion para ver el registro de actividades.
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
        <h1 className="text-3xl font-bold text-gray-900">Registro de Actividades</h1>
        <p className="text-gray-500 mt-1">
          Historial de todas las acciones realizadas en la plataforma
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
