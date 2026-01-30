"use server";

import { revalidatePath } from "next/cache";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { createCompanySchema, updateCompanySchema, generateSlug } from "@/lib/validations/company";
import type { CompanyListItem, CompanySelectorItem } from "@/types/company";

/**
 * Server action to get all companies (SUPERADMIN only)
 */
export async function getCompanies(): Promise<CompanyListItem[]> {
  await requireRole([UserRole.SUPERADMIN]);

  const companies = await prisma.company.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      logo: true,
      createdAt: true,
      _count: {
        select: {
          userCompanies: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return companies;
}

/**
 * Server action to get companies for selector (SUPERADMIN only)
 */
export async function getCompaniesForSelector(): Promise<CompanySelectorItem[]> {
  await requireRole([UserRole.SUPERADMIN]);

  const companies = await prisma.company.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      logo: true,
    },
    orderBy: { name: "asc" },
  });

  return companies;
}

/**
 * Server action to create a company (SUPERADMIN only)
 */
export async function createCompany(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prevState: any,
  formData: FormData
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    await requireRole([UserRole.SUPERADMIN]);

    const rawData = {
      name: formData.get("name") as string,
      slug: (formData.get("slug") as string) || undefined,
    };

    // Validate input
    const validationResult = createCompanySchema.safeParse(rawData);
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.errors[0].message,
      };
    }

    const { name, slug: customSlug } = validationResult.data;
    const slug = customSlug || generateSlug(name);

    // Check if slug already exists
    const existingCompany = await prisma.company.findUnique({
      where: { slug },
    });

    if (existingCompany) {
      return {
        success: false,
        error: "Ya existe una empresa con este identificador",
      };
    }

    // Create company
    const company = await prisma.company.create({
      data: {
        name,
        slug,
      },
    });

    revalidatePath("/admin/empresas");

    return {
      success: true,
      id: company.id,
    };
  } catch (error) {
    console.error("Error creating company:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al crear la empresa",
    };
  }
}

/**
 * Server action to update a company (SUPERADMIN only)
 */
export async function updateCompany(
  companyId: string,
  data: { name?: string; slug?: string; logo?: string | null }
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireRole([UserRole.SUPERADMIN]);

    const validationResult = updateCompanySchema.safeParse({ id: companyId, ...data });
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.errors[0].message,
      };
    }

    const { name, slug, logo } = validationResult.data;

    // Check if company exists
    const existingCompany = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!existingCompany) {
      return {
        success: false,
        error: "Empresa no encontrada",
      };
    }

    // If slug is being changed, check it's not taken
    if (slug && slug !== existingCompany.slug) {
      const slugExists = await prisma.company.findUnique({
        where: { slug },
      });

      if (slugExists) {
        return {
          success: false,
          error: "Ya existe una empresa con este identificador",
        };
      }
    }

    await prisma.company.update({
      where: { id: companyId },
      data: {
        ...(name !== undefined && { name }),
        ...(slug !== undefined && { slug }),
        ...(logo !== undefined && { logo }),
      },
    });

    revalidatePath("/admin/empresas");
    revalidatePath(`/admin/empresas/${companyId}`);

    return { success: true };
  } catch (error) {
    console.error("Error updating company:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al actualizar la empresa",
    };
  }
}

/**
 * Server action to delete a company (SUPERADMIN only)
 * Note: Cannot delete a company with users
 */
export async function deleteCompany(
  companyId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireRole([UserRole.SUPERADMIN]);

    // Check if company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        _count: {
          select: {
            userCompanies: true,
          },
        },
      },
    });

    if (!company) {
      return {
        success: false,
        error: "Empresa no encontrada",
      };
    }

    // Check if company has users
    if (company._count.userCompanies > 0) {
      return {
        success: false,
        error: "No se puede eliminar una empresa con usuarios. Primero transfiere o elimina los usuarios.",
      };
    }

    await prisma.company.delete({
      where: { id: companyId },
    });

    revalidatePath("/admin/empresas");

    return { success: true };
  } catch (error) {
    console.error("Error deleting company:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al eliminar la empresa",
    };
  }
}

/**
 * Server action to get a company by ID (SUPERADMIN only)
 */
export async function getCompanyById(
  companyId: string
): Promise<CompanyListItem | null> {
  try {
    await requireRole([UserRole.SUPERADMIN]);

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        createdAt: true,
        _count: {
          select: {
            userCompanies: true,
          },
        },
      },
    });

    return company;
  } catch (error) {
    console.error("Error getting company:", error);
    return null;
  }
}
