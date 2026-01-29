"use client";

import { signIn, getProviders } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Providers = Awaited<ReturnType<typeof getProviders>>;

function SignInContent() {
  const [providers, setProviders] = useState<Providers>(null);
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/big-rocks";
  const error = searchParams.get("error");

  useEffect(() => {
    getProviders().then(setProviders);
  }, []);

  const handleSignIn = async (providerId: string) => {
    setIsLoading(true);
    await signIn(providerId, { callbackUrl });
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Plataforma FASE</h1>
          <p className="text-muted-foreground">
            Metodología de gestión de objetivos
          </p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>Iniciar Sesión</CardTitle>
            <CardDescription>
              Accede a tu cuenta para gestionar tus objetivos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-950 rounded-md">
                {error === "OAuthAccountNotLinked"
                  ? "Este email ya está asociado a otra cuenta."
                  : "Ocurrió un error al iniciar sesión. Inténtalo de nuevo."}
              </div>
            )}

            {providers &&
              Object.values(providers).map((provider) => (
                <Button
                  key={provider.id}
                  variant="outline"
                  className="w-full h-12 text-base"
                  onClick={() => handleSignIn(provider.id)}
                  disabled={isLoading}
                >
                  {provider.id === "google" && (
                    <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                  )}
                  {isLoading ? "Conectando..." : `Continuar con ${provider.name}`}
                </Button>
              ))}

            {!providers && (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-8 grid grid-cols-4 gap-2 text-center text-xs text-muted-foreground">
          <div className="p-2 rounded bg-blue-50 dark:bg-blue-950">
            <span className="font-semibold text-blue-600 dark:text-blue-400">F</span>ocus
          </div>
          <div className="p-2 rounded bg-purple-50 dark:bg-purple-950">
            <span className="font-semibold text-purple-600 dark:text-purple-400">A</span>tención
          </div>
          <div className="p-2 rounded bg-green-50 dark:bg-green-950">
            <span className="font-semibold text-green-600 dark:text-green-400">S</span>istemas
          </div>
          <div className="p-2 rounded bg-orange-50 dark:bg-orange-950">
            <span className="font-semibold text-orange-600 dark:text-orange-400">E</span>nergía
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Por Agustín Peralt
        </p>
      </div>
    </main>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </main>
      }
    >
      <SignInContent />
    </Suspense>
  );
}
