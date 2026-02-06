import { Suspense } from "react";
import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { getServerSession } from "next-auth";
import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { LanguageSelector } from "@/components/language-selector";
import { CompanySwitcherWrapper } from "@/components/admin/company-switcher-wrapper";
import { UserMenu } from "@/components/user-menu";
import { NavigationProgress } from "@/components/navigation-progress";
import { OnboardingProvider } from "@/components/onboarding";
import { ChatButton } from "@/components/chat";
import { AppSwitcher } from "@/components/app-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { MobileNav } from "@/components/mobile-nav";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { UserRole, AppType } from "@prisma/client";
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

  // Detect current app from URL path (more reliable than session)
  const headersList = await headers();
  const pathname = headersList.get("x-pathname")
    || headersList.get("x-invoke-path")
    || headersList.get("x-matched-path")
    || "";

  // Determine current app based on URL path
  const isOkrRoute = pathname.startsWith("/okr");
  const currentAppCode = isOkrRoute ? AppType.OKR : (user.currentAppCode || AppType.FASE);
  const showAppSwitcher = user.apps && user.apps.length > 1;

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
  const tChat = await getTranslations("chat");
  const tApps = await getTranslations("apps");
  const tOkr = await getTranslations("okr");

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
  };

  // Check if onboarding is completed (null = not completed, Date = completed)
  const onboardingCompleted = user.onboardingCompletedAt !== null;

  // Translations for AI chat
  const chatTranslations = {
    title: tChat("title"),
    placeholder: tChat("placeholder"),
    credits: tChat("credits"),
    creditsRemaining: tChat("creditsRemaining"),
    noCredits: tChat("noCredits"),
    thinking: tChat("thinking"),
    error: tChat("error"),
    newConversation: tChat("newConversation"),
    welcome: tChat("welcome"),
  };

  // Translations for app switcher
  const appTranslations = {
    switchApp: tApps("switchApp"),
  };

  // Translations for OKR navigation
  const okrNavTranslations = {
    dashboard: tOkr("dashboard"),
    objectives: tOkr("objectives"),
    teams: tOkr("teams"),
    quarters: tOkr("quarters"),
  };

  return (
    <OnboardingProvider
      translations={onboardingTranslations}
      onboardingCompleted={onboardingCompleted}
    >
      <div className="min-h-screen bg-background">
        {/* Navigation progress indicator */}
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>

      {/* Navigation */}
      <nav className="bg-card border-b shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Mobile menu button */}
            <MobileNav
              currentAppCode={currentAppCode}
              translations={{
                menu: t("menu"),
                home: t("home"),
                bigRocks: t("bigRocks"),
                calendar: t("calendar"),
                dashboard: okrNavTranslations.dashboard,
                objectives: okrNavTranslations.objectives,
                teams: okrNavTranslations.teams,
                quarters: okrNavTranslations.quarters,
              }}
              isAdmin={isAdmin}
              isSupervisor={isSupervisor}
              adminLabel={t("admin")}
              supervisorLabel={t("supervisor")}
            />

            {/* Logo and main nav */}
            <div className="flex items-center gap-8">
              <Link href="/home" className="flex items-center gap-2">
                {currentCompanyLogo ? (
                  <div className="relative w-8 h-8 rounded-lg overflow-hidden">
                    <Image
                      src={currentCompanyLogo}
                      alt={currentCompanyName || ""}
                      fill
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {currentCompanyName ? currentCompanyName.charAt(0).toUpperCase() : "F"}
                    </span>
                  </div>
                )}
                <span className="font-bold text-xl text-foreground">
                  {currentCompanyName ? currentCompanyName.toUpperCase() : "FASE"}
                </span>
              </Link>

              <div className="hidden md:flex items-center gap-1">
                {/* FASE Navigation */}
                {currentAppCode === AppType.FASE && (
                  <>
                    <Link href="/big-rocks" data-tour="nav-big-rocks">
                      <Button variant="ghost">{t("bigRocks")}</Button>
                    </Link>
                    <Link href="/calendario">
                      <Button variant="ghost">{t("calendar")}</Button>
                    </Link>
                  </>
                )}

                {/* OKR Navigation */}
                {currentAppCode === AppType.OKR && (
                  <>
                    <Link href="/okr">
                      <Button variant="ghost">{okrNavTranslations.dashboard}</Button>
                    </Link>
                    <Link href="/okr/objetivos">
                      <Button variant="ghost">{okrNavTranslations.objectives}</Button>
                    </Link>
                    <Link href="/okr/equipos">
                      <Button variant="ghost">{okrNavTranslations.teams}</Button>
                    </Link>
                    <Link href="/okr/trimestres">
                      <Button variant="ghost">{okrNavTranslations.quarters}</Button>
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* User menu */}
            <div className="flex items-center gap-4">
              {showAppSwitcher && user.apps && (
                <AppSwitcher
                  apps={user.apps}
                  currentAppId={user.currentAppId || null}
                  currentAppCode={currentAppCode}
                  translations={appTranslations}
                />
              )}
              {showCompanySwitcher && (
                <CompanySwitcherWrapper
                  companies={companies}
                  currentCompanyId={user.currentCompanyId}
                  currentCompanyName={currentCompanyName}
                  currentCompanyLogo={currentCompanyLogo}
                  isSuperAdmin={isSuperAdmin}
                  translations={companySwitcherTranslations}
                />
              )}
              <ThemeToggle />
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
                  admin: t("admin"),
                  supervisor: t("supervisor"),
                  activity: t("activity"),
                  achievements: t("achievements"),
                }}
                isAdmin={isAdmin}
                isSupervisor={isSupervisor}
                showActivity={currentAppCode === AppType.FASE}
                userApps={user.apps || []}
              />
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">{children}</main>

      {/* Footer */}
      <footer className="border-t bg-card mt-auto">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-sm text-muted-foreground">
            <p>
              Plataforma de metodologia de gestio Estrategica - Ametller Origen | © {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </footer>

      {/* AI Chat */}
      <ChatButton translations={chatTranslations} />
    </div>
    </OnboardingProvider>
  );
}
