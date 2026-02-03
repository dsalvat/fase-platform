import { UserRole, UserStatus } from "@prisma/client";
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: UserRole;
      status: UserStatus;
      currentCompanyId: string | null; // Empresa actual seleccionada
      companies: { id: string; name: string; logo: string | null }[]; // Empresas del usuario
      onboardingCompletedAt: Date | null; // Onboarding tracking
    };
  }

  interface User {
    role: UserRole;
    status: UserStatus;
    currentCompanyId: string | null;
    onboardingCompletedAt: Date | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    status: UserStatus;
    currentCompanyId: string | null;
    companies: { id: string; name: string; logo: string | null }[];
    onboardingCompletedAt: Date | null;
  }
}
