import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { getCurrentCompanyId } from "@/lib/company-context";
import { successResponse, handleApiError } from "@/lib/api-response";
import { userQuerySchema } from "@/lib/validations/user";
import { Prisma } from "@prisma/client";

/**
 * GET /api/users
 * List all users (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    await requireRole(["ADMIN"]);

    const { searchParams } = new URL(request.url);
    const companyId = await getCurrentCompanyId();

    const rawParams = {
      page: searchParams.get("page") || undefined,
      limit: searchParams.get("limit") || undefined,
      search: searchParams.get("search") || undefined,
      role: searchParams.get("role") || undefined,
    };

    const validationResult = userQuerySchema.safeParse(rawParams);
    if (!validationResult.success) {
      return handleApiError(new Error(validationResult.error.errors[0].message));
    }

    const { page, limit, search, role } = validationResult.data;
    const skip = (page - 1) * limit;

    // Build where clause - scope by company if available
    const where: Prisma.UserWhereInput = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
      ];
    }

    // Filter by role in UserCompany for the current company
    if (role && companyId) {
      where.companies = {
        some: {
          companyId,
          role,
        },
      };
    } else if (companyId) {
      where.companies = { some: { companyId } };
    }

    // Get total count and users in parallel
    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          createdAt: true,
          companies: companyId
            ? {
                where: { companyId },
                select: {
                  role: true,
                  supervisor: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                    },
                  },
                },
              }
            : {
                select: {
                  role: true,
                  supervisor: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                    },
                  },
                },
              },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    // Transform to include per-company role and supervisor
    const transformedUsers = users.map((user) => {
      const uc = user.companies[0];
      return {
        ...user,
        role: uc?.role || "USER",
        supervisor: uc?.supervisor || null,
        companies: undefined,
      };
    });

    const totalPages = Math.ceil(total / limit);

    return successResponse({
      users: transformedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
