import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { successResponse, handleApiError } from "@/lib/api-response";
import { createKeyPersonSchema } from "@/lib/validations/key-person";

/**
 * GET /api/key-people
 * List Key People for the authenticated user
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Query Key People
    const keyPeople = await prisma.keyPerson.findMany({
      where: {
        userId: user.id,
      },
      include: {
        _count: {
          select: {
            bigRocks: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return successResponse(keyPeople);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/key-people
 * Create a new Key Person
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await request.json();

    // Validate request body
    const validationResult = createKeyPersonSchema.safeParse(body);
    if (!validationResult.success) {
      return handleApiError(new Error(validationResult.error.errors[0].message));
    }

    const { firstName, lastName, role, contact } = validationResult.data;

    // Create Key Person
    const keyPerson = await prisma.keyPerson.create({
      data: {
        firstName,
        lastName,
        role: role || null,
        contact: contact || null,
        userId: user.id,
      },
    });

    return successResponse(keyPerson, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
