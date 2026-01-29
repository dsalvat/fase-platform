import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { UserRole } from "@prisma/client";
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
          // Crear o actualizar usuario en la base de datos
          const dbUser = await prisma.user.upsert({
            where: { email: user.email },
            update: {
              name: user.name,
              image: user.image,
            },
            create: {
              email: user.email,
              name: user.name,
              image: user.image,
              role: "USER",
              // Inicializar gamificación para nuevo usuario
              gamification: {
                create: {
                  points: 0,
                  level: 1,
                  currentStreak: 0,
                  longestStreak: 0,
                },
              },
            },
            include: {
              gamification: true,
            },
          });

          // Si el usuario existe pero no tiene gamificación, crearla
          if (!dbUser.gamification) {
            await prisma.gamification.create({
              data: {
                userId: dbUser.id,
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
    async jwt({ token, trigger }) {
      // Obtener datos actualizados de la BD en cada refresh
      if (trigger === "signIn" || trigger === "update") {
        if (token.email) {
          const dbUser = await prisma.user.findUnique({
            where: { email: token.email },
            select: { id: true, role: true },
          });
          if (dbUser) {
            token.id = dbUser.id;
            token.role = dbUser.role;
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
  },
};
