import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { UserRole, UserStatus, AppType } from "@prisma/client";
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
            isSuperAdmin: true,
            status: true,
            currentCompanyId: true,
            currentAppId: true,
            onboardingCompletedAt: true,
            companies: {
              select: {
                companyId: true,
                role: true,
                company: {
                  select: {
                    id: true,
                    name: true,
                    logo: true,
                  },
                },
              },
            },
            apps: {
              select: {
                app: {
                  select: {
                    id: true,
                    code: true,
                    name: true,
                  },
                },
              },
            },
          },
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.isSuperAdmin = dbUser.isSuperAdmin;
          token.status = dbUser.status;
          token.onboardingCompletedAt = dbUser.onboardingCompletedAt;
          token.companies = dbUser.companies.map((uc) => uc.company);
          token.apps = dbUser.apps.map((ua) => ua.app);

          // Solo inicializar currentCompanyId en signIn o si no existe
          if (trigger === "signIn" || token.currentCompanyId === undefined) {
            // Usar currentCompanyId de la BD, o la primera empresa del usuario
            token.currentCompanyId = dbUser.currentCompanyId || (dbUser.companies[0]?.company.id ?? null);
          }

          // Resolve role from UserCompany based on currentCompanyId
          if (dbUser.isSuperAdmin) {
            token.role = UserRole.SUPERADMIN;
          } else {
            const resolvedCompanyId = (token.currentCompanyId as string | null) || dbUser.currentCompanyId;
            const currentUc = dbUser.companies.find((uc) => uc.companyId === resolvedCompanyId);
            token.role = currentUc?.role || UserRole.USER;
          }

          // Solo inicializar currentAppId en signIn o si no existe
          if (trigger === "signIn" || token.currentAppId === undefined) {
            // Usar currentAppId de la BD, o la primera app del usuario (preferir FASE)
            const faseApp = dbUser.apps.find((ua) => ua.app.code === AppType.FASE);
            token.currentAppId = dbUser.currentAppId || faseApp?.app.id || (dbUser.apps[0]?.app.id ?? null);
          }

          // Determinar el código de la app actual
          const currentApp = dbUser.apps.find((ua) => ua.app.id === token.currentAppId);
          token.currentAppCode = currentApp?.app.code || null;
        }
      }

      // Permitir cambio de empresa para todos los usuarios con múltiples empresas o SUPERADMIN
      if (trigger === "update" && session?.currentCompanyId !== undefined) {
        const isSuperAdminUser = token.isSuperAdmin === true;
        const userCompanyIds = (token.companies as { id: string }[])?.map((c) => c.id) || [];
        const canSwitch = isSuperAdminUser || userCompanyIds.includes(session.currentCompanyId as string) || session.currentCompanyId === null;

        if (canSwitch) {
          token.currentCompanyId = session.currentCompanyId;

          // Re-resolve role for the new company
          if (!isSuperAdminUser && session.currentCompanyId) {
            const newUc = await prisma.userCompany.findUnique({
              where: { userId_companyId: { userId: token.id as string, companyId: session.currentCompanyId as string } },
              select: { role: true },
            });
            token.role = newUc?.role || UserRole.USER;
          }

          // Actualizar currentCompanyId en la BD para persistir la selección
          if (token.id) {
            await prisma.user.update({
              where: { id: token.id as string },
              data: { currentCompanyId: session.currentCompanyId },
            });
          }
        }
      }

      // Permitir cambio de app
      if (trigger === "update" && session?.currentAppId !== undefined) {
        const userAppIds = (token.apps as { id: string }[])?.map((a) => a.id) || [];
        const canSwitchApp = userAppIds.includes(session.currentAppId as string);

        if (canSwitchApp) {
          token.currentAppId = session.currentAppId;

          // Determinar el código de la app actual
          const currentApp = (token.apps as { id: string; code: AppType }[])?.find(
            (a) => a.id === session.currentAppId
          );
          token.currentAppCode = currentApp?.code || null;

          // Actualizar currentAppId en la BD para persistir la selección
          if (token.id) {
            await prisma.user.update({
              where: { id: token.id as string },
              data: { currentAppId: session.currentAppId },
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
        session.user.isSuperAdmin = token.isSuperAdmin as boolean;
        session.user.status = token.status as UserStatus;
        session.user.currentCompanyId = token.currentCompanyId as string | null;
        session.user.companies = (token.companies as { id: string; name: string; logo: string | null }[]) || [];
        session.user.onboardingCompletedAt = token.onboardingCompletedAt as Date | null;
        // Multi-app support
        session.user.currentAppId = token.currentAppId as string | null;
        session.user.currentAppCode = token.currentAppCode as AppType | null;
        session.user.apps = (token.apps as { id: string; code: AppType; name: string }[]) || [];
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
