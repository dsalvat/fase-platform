import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { authOptions } from "@/lib/auth-options";
import { UserRole } from "@prisma/client";
import { Users, Building2 } from "lucide-react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  const userRole = session?.user?.role;
  const t = await getTranslations();

  // Only admins and superadmins can access admin pages
  if (userRole !== UserRole.ADMIN && userRole !== UserRole.SUPERADMIN) {
    redirect("/unauthorized");
  }

  const isSuperAdmin = userRole === UserRole.SUPERADMIN;

  return (
    <div className="space-y-6">
      {/* Admin Navigation Tabs */}
      <nav className="border-b">
        <div className="flex gap-4">
          <NavLink href="/admin/usuarios" icon={<Users className="w-4 h-4" />}>
            {t("admin.title")}
          </NavLink>
          {isSuperAdmin && (
            <NavLink href="/admin/empresas" icon={<Building2 className="w-4 h-4" />}>
              {t("admin.companies")}
            </NavLink>
          )}
        </div>
      </nav>

      {/* Page Content */}
      {children}
    </div>
  );
}

function NavLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground border-b-2 border-transparent hover:text-foreground hover:border-gray-300 transition-colors"
    >
      {icon}
      {children}
    </Link>
  );
}
