import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { User, Mail, Shield, Building2 } from "lucide-react";
import { ProfileForm } from "@/components/profile/profile-form";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  const t = await getTranslations("profile");
  const tCommon = await getTranslations("common");

  // Get full user data with per-company info
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      companies: {
        include: {
          supervisor: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          company: {
            select: {
              id: true,
              name: true,
              logo: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    redirect("/api/auth/signin");
  }

  // Per-company role from session (already resolved in auth-options)
  const userRole = session.user.role || UserRole.USER;

  const roleLabels: Record<UserRole, string> = {
    USER: t("roleUser"),
    SUPERVISOR: t("roleSupervisor"),
    ADMIN: t("roleAdmin"),
    SUPERADMIN: t("roleSuperAdmin"),
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <User className="w-6 h-6 text-blue-700" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
      </div>

      {/* User Info Card (Read-only) */}
      <Card>
        <CardHeader>
          <CardTitle>{t("accountInfo")}</CardTitle>
          <CardDescription>{t("accountInfoDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Email (read-only) */}
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">{t("email")}</p>
              <p className="font-medium">{user.email}</p>
            </div>
          </div>

          {/* Role (read-only) */}
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">{t("role")}</p>
              <p className="font-medium">{roleLabels[userRole]}</p>
            </div>
          </div>

          {/* Companies (read-only) */}
          {user.companies.length > 0 && (
            <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
              <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">{t("companies")}</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {user.companies.map((uc) => (
                    <span
                      key={uc.company.id}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded text-sm border"
                    >
                      {uc.company.logo && (
                        <img
                          src={uc.company.logo}
                          alt=""
                          className="w-4 h-4 rounded object-contain"
                        />
                      )}
                      {uc.company.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Editable Profile Form */}
      <Card>
        <CardHeader>
          <CardTitle>{t("editProfile")}</CardTitle>
          <CardDescription>{t("editProfileDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm
            user={{
              id: user.id,
              name: user.name,
            }}
            translations={{
              name: t("name"),
              namePlaceholder: t("namePlaceholder"),
              save: tCommon("save"),
              saving: tCommon("loading"),
              saved: t("saved"),
              error: tCommon("error"),
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
