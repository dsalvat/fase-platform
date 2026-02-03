import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { UserRole, UserStatus } from "@prisma/client";
import { prisma } from "./db";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        try {
          // Buscar usuario existente en la base de datos
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
            include: { gamification: true },
          });

          // Si el usuario no existe, no permitir el login (debe ser invitado primero)
          if (!existingUser) {
            console.log(`Login rechazado: usuario no invitado (${user.email})`);
            return "/auth/error?error=NotInvited";
          }

          // Si el usuario está desactivado, no permitir el login
          if (existingUser.status === UserStatus.DEACTIVATED) {
            console.log(`Login rechazado: usuario desactivado (${user.email})`);
            return "/auth/error?error=UserDeactivated";
          }

          // Si el usuario está invitado, activarlo al hacer login
          if (existingUser.status === UserStatus.INVITED) {
            await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                status: UserStatus.ACTIVE,
                name: user.name,
                image: user.image,
              },
            });
            console.log(`Usuario activado: ${user.email}`);
          } else {
            // Usuario activo, solo actualizar nombre e imagen
            await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                name: user.name,
                image: user.image,
              },
            });
          }

          // Si el usuario no tiene gamificación, crearla
          if (!existingUser.gamification) {
            await prisma.gamification.create({
              data: {
                userId: existingUser.id,
                points: 0,
                level: 1,
                currentStreak: 0,
                longestStreak: 0,
              },
            });
          }

          return true;
        } catch (error) {
          console.error("Error durante signIn:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, trigger, session }) {
      // Siempre obtener datos actualizados de la BD para reflejar cambios de rol
      if (token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
          select: {
            id: true,
            role: true,
            status: true,
            currentCompanyId: true,
            onboardingCompletedAt: true,
            companies: {
              select: {
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
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.status = dbUser.status;
          token.onboardingCompletedAt = dbUser.onboardingCompletedAt;
          token.companies = dbUser.companies.map((uc) => uc.company);

          // Solo inicializar currentCompanyId en signIn o si no existe
          if (trigger === "signIn" || token.currentCompanyId === undefined) {
            // Usar currentCompanyId de la BD, o la primera empresa del usuario
            token.currentCompanyId = dbUser.currentCompanyId || (dbUser.companies[0]?.company.id ?? null);
          }
        }
      }

      // Permitir cambio de empresa para todos los usuarios con múltiples empresas o SUPERADMIN
      if (trigger === "update" && session?.currentCompanyId !== undefined) {
        const isSuperAdmin = token.role === UserRole.SUPERADMIN;
        const userCompanyIds = (token.companies as { id: string }[])?.map((c) => c.id) || [];
        const canSwitch = isSuperAdmin || userCompanyIds.includes(session.currentCompanyId as string) || session.currentCompanyId === null;

        if (canSwitch) {
          token.currentCompanyId = session.currentCompanyId;

          // Actualizar currentCompanyId en la BD para persistir la selección
          if (token.id) {
            await prisma.user.update({
              where: { id: token.id as string },
              data: { currentCompanyId: session.currentCompanyId },
            });
          }
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.status = token.status as UserStatus;
        session.user.currentCompanyId = token.currentCompanyId as string | null;
        session.user.companies = (token.companies as { id: string; name: string; logo: string | null }[]) || [];
        session.user.onboardingCompletedAt = token.onboardingCompletedAt as Date | null;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
  },
};
