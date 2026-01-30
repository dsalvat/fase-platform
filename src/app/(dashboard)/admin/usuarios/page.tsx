import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { UserList } from "@/components/admin";
import { Shield } from "lucide-react";

async function getUsers() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      role: true,
      createdAt: true,
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

  return users;
}

async function getAllUsersForSelector() {
  const users = await prisma.user.findMany({
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userRole = ((session?.user as any)?.role as UserRole) || "USER";

  // Only admins can access this page
  if (userRole !== "ADMIN") {
    redirect("/unauthorized");
  }

  const [users, allUsers] = await Promise.all([
    getUsers(),
    getAllUsersForSelector(),
  ]);

  const stats = {
    total: users.length,
    admins: users.filter((u) => u.role === "ADMIN").length,
    supervisors: users.filter((u) => u.role === "SUPERVISOR").length,
    users: users.filter((u) => u.role === "USER").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-purple-100 rounded-lg">
          <Shield className="w-6 h-6 text-purple-700" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion de Usuarios</h1>
          <p className="text-gray-500">Administra roles y supervisores</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Total" value={stats.total} color="gray" />
        <StatCard label="Administradores" value={stats.admins} color="purple" />
        <StatCard label="Supervisores" value={stats.supervisors} color="blue" />
        <StatCard label="Usuarios" value={stats.users} color="green" />
      </div>

      {/* User List */}
      <UserList
        users={users}
        allUsers={allUsers}
        currentUserId={userId || ""}
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
  color: "gray" | "purple" | "blue" | "green";
}) {
  const colors = {
    gray: "bg-gray-50 border-gray-200",
    purple: "bg-purple-50 border-purple-200",
    blue: "bg-blue-50 border-blue-200",
    green: "bg-green-50 border-green-200",
  };

  return (
    <div className={`p-4 rounded-lg border ${colors[color]}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-gray-600">{label}</p>
    </div>
  );
}
