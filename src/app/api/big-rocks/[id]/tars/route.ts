import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, canAccessBigRock } from "@/lib/auth";
import { successResponse, handleApiError } from "@/lib/api-response";
import { uuidParamSchema } from "@/lib/validations/big-rock";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/big-rocks/:id/tars
 * Get all TARs for a specific Big Rock
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: bigRockId } = await params;
    const user = await requireAuth();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userRole = (user as any).role;

    // Validate ID format
    const idValidation = uuidParamSchema.safeParse(bigRockId);
    if (!idValidation.success) {
      return handleApiError(new Error("ID inválido"));
    }

    // Check access permissions to the Big Rock
    const hasAccess = await canAccessBigRock(bigRockId, user.id, userRole);
    if (!hasAccess) {
      return handleApiError(new Error("Forbidden"));
    }

    // Query TARs for this Big Rock
    const tars = await prisma.tAR.findMany({
      where: {
        bigRockId,
      },
      include: {
        _count: {
          select: {
            activities: true,
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
