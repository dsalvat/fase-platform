"use client";

import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LogOut, ArrowLeft } from "lucide-react";

export default function SignOutPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslations("auth");
  const tPlatform = useTranslations("platform");

  const handleSignOut = async () => {
    setIsLoading(true);
    await signOut({ callbackUrl: "/auth/signin" });
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">{tPlatform("title")}</h1>
          <p className="text-muted-foreground">
            {tPlatform("subtitle")}
          </p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>{t("signOut")}</CardTitle>
            <CardDescription>
              {t("signOutConfirm")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="destructive"
              className="w-full h-12 text-base"
              onClick={handleSignOut}
              disabled={isLoading}
            >
              <LogOut className="mr-2 h-5 w-5" />
              {isLoading ? t("signingOut") : t("signOutButton")}
            </Button>

            <Button
              variant="outline"
              className="w-full h-12 text-base"
              onClick={handleGoBack}
              disabled={isLoading}
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              {t("backToApp")}
            </Button>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Por Agustin Peralt
        </p>
      </div>
    </main>
  );
}
