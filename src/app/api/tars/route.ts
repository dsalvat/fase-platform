import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, canAccessBigRock, canModifyBigRock } from "@/lib/auth";
import { successResponse, handleApiError } from "@/lib/api-response";
import { uuidParamSchema } from "@/lib/validations/big-rock";
import { createTARSchema } from "@/lib/validations/tar";

/**
 * GET /api/tars
 * List TARs - requires bigRockId query parameter
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userRole = (user as any).role;
    const { searchParams } = new URL(request.url);

    const bigRockId = searchParams.get("bigRockId");

    if (!bigRockId) {
      return handleApiError(new Error("bigRockId is required"));
    }

    // Validate bigRockId
    const idValidation = uuidParamSchema.safeParse(bigRockId);
    if (!idValidation.success) {
      return handleApiError(new Error("Invalid bigRockId format"));
    }

    // Check access permissions to the Big Rock
    const hasAccess = await canAccessBigRock(bigRockId, user.id, userRole);
    if (!hasAccess) {
      return handleApiError(new Error("Forbidden"));
    }

    // Query TARs
    const tars = await prisma.tAR.findMany({
      where: {
        bigRockId,
      },
      include: {
        _count: {
          select: {
            activities: true,
            keyPeople: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return successResponse(tars);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/tars
 * Create a new TAR
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userRole = (user as any).role;

    const body = await request.json();

    // Validate with Zod
    const validation = createTARSchema.safeParse(body);
    if (!validation.success) {
      return handleApiError(new Error(validation.error.errors[0].message));
    }

    const validated = validation.data;

    // Check if user can modify the Big Rock
    const canModify = await canModifyBigRock(validated.bigRockId, user.id, userRole);
    if (!canModify) {
      return handleApiError(new Error("Forbidden"));
    }

    // Create TAR
    const tar = await prisma.tAR.create({
      data: validated,
      include: {
        bigRock: {
          select: {
            id: true,
            title: true,
            month: true,
          },
        },
      },
    });

    return successResponse(tar, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
