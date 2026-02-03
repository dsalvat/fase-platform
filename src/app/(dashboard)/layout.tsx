import { Suspense } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { LanguageSelector } from "@/components/language-selector";
import { CompanySwitcherWrapper } from "@/components/admin/company-switcher-wrapper";
import { UserMenu } from "@/components/user-menu";
import { NavigationProgress } from "@/components/navigation-progress";
import { OnboardingProvider } from "@/components/onboarding";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
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
  const userRole = user?.role || UserRole.USER;
  const isAdmin = userRole === UserRole.ADMIN || userRole === UserRole.SUPERADMIN;
  const isSuperAdmin = userRole === UserRole.SUPERADMIN;
  const isSupervisor = userRole === UserRole.SUPERVISOR || isAdmin;

  // Get companies for the company switcher
  let companies: { id: string; name: string; slug: string; logo: string | null }[] = [];
  let currentCompanyName: string | undefined;
  let currentCompanyLogo: string | null | undefined;

  if (isSuperAdmin) {
    // SUPERADMIN sees all companies
    companies = await prisma.company.findMany({
      select: { id: true, name: true, slug: true, logo: true },
      orderBy: { name: "asc" },
    });
  } else {
    // Regular users see their assigned companies
    companies = (user.companies || []).map((c) => ({ ...c, slug: "" }));
  }

  // Show company switcher if user has companies to switch between
  const showCompanySwitcher = isSuperAdmin || companies.length > 1;

  // Get current company info
  if (user.currentCompanyId && companies.length > 0) {
    const currentCompany = companies.find((c) => c.id === user.currentCompanyId);
    currentCompanyName = currentCompany?.name;
    currentCompanyLogo = currentCompany?.logo;
  } else if (companies.length === 1) {
    // If only one company and no currentCompanyId, use that company
    currentCompanyName = companies[0].name;
    currentCompanyLogo = companies[0].logo;
  }

  // Get current locale from cookie
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("NEXT_LOCALE")?.value;
  const currentLocale: Locale = (localeCookie && locales.includes(localeCookie as Locale))
    ? localeCookie as Locale
    : defaultLocale;

  // Get translations
  const t = await getTranslations("nav");
  const tCompanies = await getTranslations("companies");
  const tOnboarding = await getTranslations("onboarding");

  // Translations for company switcher
  const companySwitcherTranslations = {
    noCompanySelected: tCompanies("noCompanySelected"),
    selectCompany: tCompanies("selectCompany"),
  };

  // Translations for onboarding tour
  const onboardingTranslations = {
    skipTour: tOnboarding("skipTour"),
    nextStep: tOnboarding("nextStep"),
    previousStep: tOnboarding("previousStep"),
    finish: tOnboarding("finish"),
    stepOf: tOnboarding("stepOf"),
    step1Title: tOnboarding("step1Title"),
    step1Content: tOnboarding("step1Content"),
    step2Title: tOnboarding("step2Title"),
    step2Content: tOnboarding("step2Content"),
    step3Title: tOnboarding("step3Title"),
    step3Content: tOnboarding("step3Content"),
    step4Title: tOnboarding("step4Title"),
    step4Content: tOnboarding("step4Content"),
    step5Title: tOnboarding("step5Title"),
    step5Content: tOnboarding("step5Content"),
    step6Title: tOnboarding("step6Title"),
    step6Content: tOnboarding("step6Content"),
  };

  // Check if onboarding is completed (null = not completed, Date = completed)
  const onboardingCompleted = user.onboardingCompletedAt !== null;

  return (
    <OnboardingProvider
      translations={onboardingTranslations}
      onboardingCompleted={onboardingCompleted}
    >
      <div className="min-h-screen bg-gray-50">
        {/* Navigation progress indicator */}
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>

      {/* Navigation */}
      <nav className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo and main nav */}
            <div className="flex items-center gap-8">
              <Link href="/home" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">F</span>
                </div>
                <span className="font-bold text-xl text-gray-900">FASE</span>
              </Link>

              <div className="hidden md:flex items-center gap-1">
                <Link href="/big-rocks" data-tour="nav-big-rocks">
                  <Button variant="ghost">{t("bigRocks")}</Button>
                </Link>
                <Link href="/key-people" data-tour="nav-key-people">
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
                {isSupervisor && (
                  <Link href="/supervisor">
                    <Button variant="ghost" className="text-teal-600">
                      {t("supervisor")}
                    </Button>
                  </Link>
                )}
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
              {showCompanySwitcher ? (
                <CompanySwitcherWrapper
                  companies={companies}
                  currentCompanyId={user.currentCompanyId}
                  currentCompanyName={currentCompanyName}
                  currentCompanyLogo={currentCompanyLogo}
                  isSuperAdmin={isSuperAdmin}
                  translations={companySwitcherTranslations}
                />
              ) : companies.length === 1 && (
                // Single company - just show the company name
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  {currentCompanyLogo && (
                    <img src={currentCompanyLogo} alt="" className="w-5 h-5 rounded object-contain" />
                  )}
                  <span>{currentCompanyName}</span>
                </div>
              )}
              <LanguageSelector currentLocale={currentLocale} userId={user?.id} />
              <UserMenu
                user={{
                  name: user?.name,
                  email: user?.email,
                  image: user?.image,
                }}
                translations={{
                  myProfile: t("myProfile"),
                  signOut: t("signOut"),
                }}
              />
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
              Metodología FASE para el equipo de Ametller Origen | © {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </footer>
    </div>
    </OnboardingProvider>
  );
}
