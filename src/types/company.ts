import { Company as PrismaCompany } from "@prisma/client";

/**
 * Company type for list views
 */
export type CompanyListItem = Pick<PrismaCompany, 'id' | 'name' | 'slug' | 'logo' | 'createdAt'> & {
  _count: {
    userCompanies: number;
  };
};

/**
 * Company for selector
 */
export type CompanySelectorItem = Pick<PrismaCompany, 'id' | 'name' | 'slug' | 'logo'>;

/**
 * Paginated companies response
 */
export interface PaginatedCompanies {
  companies: CompanyListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
