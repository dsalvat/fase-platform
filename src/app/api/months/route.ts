import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { successResponse, handleApiError } from "@/lib/api-response";
import {
  openMonthSchema,
  getCurrentMonth,
  getPreviousMonth,
  isMonthPast,
  isMonthFuture,
  getMonthLabel,
} from "@/lib/validations/open-month";

/**
 * GET /api/months
 * List open months for the authenticated user
 * Returns months with their status (past, current, future, open)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Get all open months for this user
    const openMonths = await prisma.openMonth.findMany({
      where: { userId: user.id },
      orderBy: { month: "desc" },
    });

    const currentMonth = getCurrentMonth();

    // Build month data with status
    const months = openMonths.map((om) => ({
      id: om.id,
      month: om.month,
      label: getMonthLabel(om.month),
      openedAt: om.openedAt,
      status: isMonthPast(om.month)
        ? "past"
        : om.month === currentMonth
        ? "current"
        : "future",
      isReadOnly: isMonthPast(om.month),
    }));

    // Add current month if not in list
    const hasCurrentMonth = months.some((m) => m.month === currentMonth);
    if (!hasCurrentMonth) {
      months.push({
        id: null as unknown as string,
        month: currentMonth,
        label: getMonthLabel(currentMonth),
        openedAt: null as unknown as Date,
        status: "current",
        isReadOnly: false,
      });
    }

    // Sort by month descending
    months.sort((a, b) => b.month.localeCompare(a.month));

    return successResponse({
      months,
      currentMonth,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/months
 * Open a future month for planning
 * Body: { month: "YYYY-MM" }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await request.json();

    // Validate request body
    const validationResult = openMonthSchema.safeParse(body);
    if (!validationResult.success) {
      return handleApiError(
        new Error(validationResult.error.errors[0].message)
      );
    }

    const { month } = validationResult.data;
    const currentMonth = getCurrentMonth();

    // Cannot open past months
    if (isMonthPast(month)) {
      return handleApiError(
        new Error("No se pueden abrir meses pasados")
      );
    }

    // Current month is always implicitly open
    if (month === currentMonth) {
      return handleApiError(
        new Error("El mes actual ya esta abierto por defecto")
      );
    }

    // Check if month is already open
    const existingOpen = await prisma.openMonth.findUnique({
      where: {
        month_userId: {
          month,
          userId: user.id,
        },
      },
    });

    if (existingOpen) {
      return handleApiError(new Error("Este mes ya esta abierto"));
    }

    // Validate that previous month is open (no gaps allowed)
    // For example, to open March, February must be open
    if (isMonthFuture(month)) {
      const previousMonth = getPreviousMonth(month);

      // If previous month is current month, it's always "open"
      if (previousMonth !== currentMonth) {
        const previousOpen = await prisma.openMonth.findUnique({
          where: {
            month_userId: {
              month: previousMonth,
              userId: user.id,
            },
          },
        });

        if (!previousOpen) {
          return handleApiError(
            new Error(
              `Debes abrir el mes anterior (${getMonthLabel(previousMonth)}) primero`
            )
          );
        }
      }
    }

    // Open the month
    const openMonth = await prisma.openMonth.create({
      data: {
        month,
        userId: user.id,
      },
    });

    return successResponse(
      {
        id: openMonth.id,
        month: openMonth.month,
        label: getMonthLabel(openMonth.month),
        openedAt: openMonth.openedAt,
        status: "future",
        isReadOnly: false,
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
