"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const errorMessages: Record<string, string> = {
  Configuration: "Hay un problema con la configuración del servidor.",
  AccessDenied: "No tienes permiso para acceder a esta aplicación.",
  Verification: "El enlace de verificación ha expirado o ya fue usado.",
  OAuthSignin: "Error al iniciar el proceso de autenticación.",
  OAuthCallback: "Error en la respuesta del proveedor de autenticación.",
  OAuthCreateAccount: "No se pudo crear la cuenta con el proveedor.",
  EmailCreateAccount: "No se pudo crear la cuenta con el email proporcionado.",
  Callback: "Error en el callback de autenticación.",
  OAuthAccountNotLinked: "Este email ya está registrado con otro método de inicio de sesión.",
  Default: "Ocurrió un error inesperado.",
};

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error") || "Default";
  const errorMessage = errorMessages[error] || errorMessages.Default;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">Error de Autenticación</CardTitle>
            <CardDescription>{errorMessage}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Si el problema persiste, contacta al administrador.
            </p>
            <Button asChild className="w-full">
              <Link href="/auth/signin">Volver a intentar</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </main>
      }
    >
      <ErrorContent />
    </Suspense>
  );
}
