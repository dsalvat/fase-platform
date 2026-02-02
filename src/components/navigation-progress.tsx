"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    // When path or search params change, navigation is complete
    setIsNavigating(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    // Add click listener to detect navigation start
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest("a");

      if (link) {
        const href = link.getAttribute("href");
        // Only for internal navigation links
        if (href && href.startsWith("/") && !href.startsWith("//")) {
          setIsNavigating(true);
        }
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  useEffect(() => {
    if (isNavigating) {
      document.body.style.cursor = "wait";
      // Also set cursor on all elements
      document.documentElement.style.setProperty("--cursor-override", "wait");
    } else {
      document.body.style.cursor = "";
      document.documentElement.style.removeProperty("--cursor-override");
    }

    return () => {
      document.body.style.cursor = "";
      document.documentElement.style.removeProperty("--cursor-override");
    };
  }, [isNavigating]);

  return null;
}
