"use server";

import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { Locale, locales } from "@/i18n/config";

// Map locale code to Prisma Language enum
const localeToPrismaLanguage: Record<Locale, "ES" | "CA" | "EN"> = {
  es: "ES",
  ca: "CA",
  en: "EN",
};

/**
 * Set user's language preference
 */
export async function setUserLanguage(locale: Locale): Promise<{ success: boolean; error?: string }> {
  try {
    if (!locales.includes(locale)) {
      return { success: false, error: "Invalid locale" };
    }

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set("NEXT_LOCALE", locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });

    // Update user preference in database if logged in
    try {
      const user = await requireAuth();
      await prisma.user.update({
        where: { id: user.id },
        data: { language: localeToPrismaLanguage[locale] },
      });
    } catch {
      // User not logged in, just use the cookie
    }

    return { success: true };
  } catch (error) {
    console.error("Error setting language:", error);
    return { success: false, error: "Error setting language" };
  }
}

/**
 * Get user's language preference
 */
export async function getUserLanguage(): Promise<Locale> {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("NEXT_LOCALE")?.value;

  if (localeCookie && locales.includes(localeCookie as Locale)) {
    return localeCookie as Locale;
  }

  return "es";
}
