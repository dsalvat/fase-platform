"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { AppType } from "@prisma/client";

/**
 * Switch user's current app
 */
export async function switchCurrentApp(appId: string) {
  const user = await requireAuth();

  // Verify user has access to this app
  const userApp = await prisma.userApp.findFirst({
    where: {
      userId: user.id,
      appId: appId,
    },
    include: {
      app: true,
    },
  });

  if (!userApp) {
    return { success: false, error: "No tienes acceso a esta aplicación" };
  }

  // Update user's current app
  await prisma.user.update({
    where: { id: user.id },
    data: { currentAppId: appId },
  });

  revalidatePath("/");
  return { success: true, appCode: userApp.app.code };
}

/**
 * Get user's apps
 */
export async function getUserApps() {
  const user = await requireAuth();

  const userApps = await prisma.userApp.findMany({
    where: { userId: user.id },
    include: {
      app: {
        select: {
          id: true,
          code: true,
          name: true,
          description: true,
          icon: true,
          isActive: true,
        },
      },
    },
  });

  return {
    success: true,
    apps: userApps.map((ua) => ua.app).filter((app) => app.isActive),
  };
}

/**
 * Enable app for a user (Admin only)
 */
export async function enableAppForUser(userId: string, appCode: AppType) {
  const currentUser = await requireAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userRole = (currentUser as any).role;

  if (userRole !== "ADMIN" && userRole !== "SUPERADMIN") {
    return { success: false, error: "No tienes permisos para esta acción" };
  }

  // Find the app
  const app = await prisma.app.findUnique({
    where: { code: appCode },
  });

  if (!app) {
    return { success: false, error: "Aplicación no encontrada" };
  }

  // Check if user already has this app
  const existingUserApp = await prisma.userApp.findUnique({
    where: {
      userId_appId: {
        userId: userId,
        appId: app.id,
      },
    },
  });

  if (existingUserApp) {
    return { success: true, message: "El usuario ya tiene esta aplicación" };
  }

  // Create UserApp
  await prisma.userApp.create({
    data: {
      userId: userId,
      appId: app.id,
    },
  });

  revalidatePath("/admin/usuarios");
  return { success: true };
}

/**
 * Disable app for a user (Admin only)
 */
export async function disableAppForUser(userId: string, appCode: AppType) {
  const currentUser = await requireAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userRole = (currentUser as any).role;

  if (userRole !== "ADMIN" && userRole !== "SUPERADMIN") {
    return { success: false, error: "No tienes permisos para esta acción" };
  }

  // Find the app
  const app = await prisma.app.findUnique({
    where: { code: appCode },
  });

  if (!app) {
    return { success: false, error: "Aplicación no encontrada" };
  }

  // Delete UserApp
  await prisma.userApp.deleteMany({
    where: {
      userId: userId,
      appId: app.id,
    },
  });

  // If user's current app is this one, reset to null
  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { currentAppId: true },
  });

  if (targetUser?.currentAppId === app.id) {
    // Find another app for this user
    const otherApp = await prisma.userApp.findFirst({
      where: { userId: userId },
      include: { app: true },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { currentAppId: otherApp?.appId || null },
    });
  }

  revalidatePath("/admin/usuarios");
  return { success: true };
}

/**
 * Get all available apps (Admin only)
 */
export async function getAllApps() {
  const user = await requireAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userRole = (user as any).role;

  if (userRole !== "ADMIN" && userRole !== "SUPERADMIN") {
    return { success: false, error: "No tienes permisos para esta acción" };
  }

  const apps = await prisma.app.findMany({
    orderBy: { name: "asc" },
  });

  return { success: true, apps };
}
