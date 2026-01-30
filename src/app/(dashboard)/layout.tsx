import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { LanguageSelector } from "@/components/language-selector";
import { authOptions } from "@/lib/auth-options";
import { UserRole } from "@prisma/client";
import { locales, Locale, defaultLocale } from "@/i18n/config";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // Redirect to sign in if not authenticated
  if (!session) {
    redirect("/api/auth/signin");
  }

  const user = session.user;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userRole = ((user as any)?.role as UserRole) || "USER";
  const isAdmin = userRole === "ADMIN";

  // Get current locale from cookie
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("NEXT_LOCALE")?.value;
  const currentLocale: Locale = (localeCookie && locales.includes(localeCookie as Locale))
    ? localeCookie as Locale
    : defaultLocale;

  // Get translations
  const t = await getTranslations("nav");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo and main nav */}
            <div className="flex items-center gap-8">
              <Link href="/big-rocks" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">F</span>
                </div>
                <span className="font-bold text-xl text-gray-900">FASE</span>
              </Link>

              <div className="hidden md:flex items-center gap-1">
                <Link href="/big-rocks">
                  <Button variant="ghost">{t("bigRocks")}</Button>
                </Link>
                <Link href="/key-people">
                  <Button variant="ghost">{t("keyPeople")}</Button>
                </Link>
                <Link href="/calendario">
                  <Button variant="ghost">{t("calendar")}</Button>
                </Link>
                <Link href="/gamificacion">
                  <Button variant="ghost">{t("gamification")}</Button>
                </Link>
                <Link href="/actividad">
                  <Button variant="ghost">{t("activity")}</Button>
                </Link>
                {isAdmin && (
                  <Link href="/admin/usuarios">
                    <Button variant="ghost" className="text-purple-600">
                      {t("admin")}
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            {/* User menu */}
            <div className="flex items-center gap-4">
              <LanguageSelector currentLocale={currentLocale} userId={user?.id} />
              <div className="text-sm text-gray-600 hidden sm:block">
                <p className="font-medium">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <Link href="/auth/signout">
                <Button variant="outline" size="sm">
                  {t("exit")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">{children}</main>

      {/* Footer */}
      <footer className="border-t bg-white mt-auto">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-sm text-gray-500">
            <p>
              Metodología FASE por Agustín Peralt | © {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
