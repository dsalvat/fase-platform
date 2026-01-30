import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, canModifyKeyPerson, canModifyTAR } from "@/lib/auth";
import { successResponse, handleApiError } from "@/lib/api-response";
import { uuidParamSchema } from "@/lib/validations/big-rock";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * POST /api/key-people/:id/tars
 * Link a Key Person to a TAR
 * Body: { tarId: string }
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: keyPersonId } = await params;
    const user = await requireAuth();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userRole = (user as any).role;

    // Validate Key Person ID format
    const idValidation = uuidParamSchema.safeParse(keyPersonId);
    if (!idValidation.success) {
      return handleApiError(new Error("ID de persona clave inválido"));
    }

    const body = await request.json();
    const { tarId } = body;

    // Validate TAR ID format
    const tarIdValidation = uuidParamSchema.safeParse(tarId);
    if (!tarIdValidation.success) {
      return handleApiError(new Error("ID de TAR inválido"));
    }

    // Check modification permissions for Key Person
    const canModifyPerson = await canModifyKeyPerson(keyPersonId, user.id, userRole);
    if (!canModifyPerson) {
      return handleApiError(new Error("Forbidden"));
    }

    // Check modification permissions for TAR
    const canModifyTar = await canModifyTAR(tarId, user.id, userRole);
    if (!canModifyTar) {
      return handleApiError(new Error("Forbidden"));
    }

    // Verify TAR belongs to same user as KeyPerson
    const [keyPerson, tar] = await Promise.all([
      prisma.keyPerson.findUnique({
        where: { id: keyPersonId },
        select: { userId: true },
      }),
      prisma.tAR.findUnique({
        where: { id: tarId },
        include: {
          bigRock: {
            select: { userId: true },
          },
        },
      }),
    ]);

    if (!keyPerson || !tar) {
      return handleApiError(new Error("Key Person o TAR no encontrado"));
    }

    if (keyPerson.userId !== tar.bigRock.userId) {
      return handleApiError(new Error("La persona clave y la TAR deben pertenecer al mismo usuario"));
    }

    // Link Key Person to TAR
    const updatedTar = await prisma.tAR.update({
      where: { id: tarId },
      data: {
        keyPeople: {
          connect: { id: keyPersonId },
        },
      },
      include: {
        keyPeople: true,
      },
    });

    return successResponse(updatedTar);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/key-people/:id/tars
 * Unlink a Key Person from a TAR
 * Body: { tarId: string }
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: keyPersonId } = await params;
    const user = await requireAuth();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userRole = (user as any).role;

    // Validate Key Person ID format
    const idValidation = uuidParamSchema.safeParse(keyPersonId);
    if (!idValidation.success) {
      return handleApiError(new Error("ID de persona clave inválido"));
    }

    const body = await request.json();
    const { tarId } = body;

    // Validate TAR ID format
    const tarIdValidation = uuidParamSchema.safeParse(tarId);
    if (!tarIdValidation.success) {
      return handleApiError(new Error("ID de TAR inválido"));
    }

    // Check modification permissions for TAR
    const canModifyTar = await canModifyTAR(tarId, user.id, userRole);
    if (!canModifyTar) {
      return handleApiError(new Error("Forbidden"));
    }

    // Unlink Key Person from TAR
    const updatedTar = await prisma.tAR.update({
      where: { id: tarId },
      data: {
        keyPeople: {
          disconnect: { id: keyPersonId },
        },
      },
      include: {
        keyPeople: true,
      },
    });

    return successResponse(updatedTar);
  } catch (error) {
    return handleApiError(error);
  }
}
