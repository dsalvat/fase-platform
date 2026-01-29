import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Rutas públicas que no requieren autenticación
const publicPaths = [
  "/auth/signin",
  "/auth/error",
  "/api/auth",
];

// Rutas que requieren rol de administrador
const adminPaths = [
  "/admin",
  "/api/admin",
];

// Rutas que requieren rol de supervisor o admin
const supervisorPaths = [
  "/supervisor",
  "/api/supervisor",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permitir recursos estáticos y archivos públicos
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Permitir rutas públicas
  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Obtener token de sesión
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Si no hay sesión, redirigir a login
  if (!token) {
    const signInUrl = new URL("/auth/signin", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Verificar permisos de administrador
  if (adminPaths.some((path) => pathname.startsWith(path))) {
    if (token.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }

  // Verificar permisos de supervisor
  if (supervisorPaths.some((path) => pathname.startsWith(path))) {
    if (token.role !== "SUPERVISOR" && token.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Proteger todas las rutas excepto recursos estáticos
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
