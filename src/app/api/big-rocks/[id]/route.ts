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
 * GET /api/big-rocks/:id
 * Get a single Big Rock with full details including relations
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await requireAuth();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userRole = (user as any).role;

    // Validate ID format
    const idValidation = uuidParamSchema.safeParse(id);
    if (!idValidation.success) {
      return handleApiError(new Error("ID inválido"));
    }

    const bigRockId = id;

    // Check access permissions
    const hasAccess = await canAccessBigRock(bigRockId, user.id, userRole);
    if (!hasAccess) {
      return handleApiError(new Error("Forbidden"));
    }

    // Fetch Big Rock with full details
    const bigRock = await prisma.bigRock.findUnique({
      where: { id: bigRockId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tars: {
          orderBy: { createdAt: "asc" },
        },
        keyMeetings: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!bigRock) {
      return handleApiError(new Error("Big Rock not found"));
    }

    return successResponse(bigRock);
  } catch (error) {
    return handleApiError(error);
  }
}
