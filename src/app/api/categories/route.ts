import { NextRequest, NextResponse } from "next/server";
import { withRBAC } from "@/lib/rbac-middleware";
import { Permission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import {
  createCategorySchema,
  categoryQuerySchema,
} from "@/lib/validations/categories";
import type { RBACContext } from "@/types";

/**
 * GET /api/categories
 * Get list of all categories with pagination and filtering
 * Accessible by: All authenticated users with CATEGORY_VIEW permission
 */
export const GET = withRBAC(
  async (request: NextRequest, _context: RBACContext) => {
    try {
      const { searchParams } = new URL(request.url);
      const params = Object.fromEntries(searchParams.entries());

      // Validate query parameters
      const validationResult = categoryQuerySchema.safeParse(params);
      if (!validationResult.success) {
        return NextResponse.json(
          {
            error: "Invalid query parameters",
            details: validationResult.error.errors,
          },
          { status: 400 }
        );
      }

      const { page, limit, search, isActive, sortBy, sortOrder } =
        validationResult.data;

      // Build where clause for filtering
      const where: {
        isActive?: boolean;
        OR?: Array<{
          name?: { contains: string; mode: "insensitive" };
          description?: { contains: string; mode: "insensitive" };
        }>;
      } = {};

      if (isActive !== undefined) {
        where.isActive = isActive;
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" as const } },
          { description: { contains: search, mode: "insensitive" as const } },
        ];
      }

      // Get total count for pagination
      const total = await prisma.category.count({ where });

      // Get paginated categories
      const categories = await prisma.category.findMany({
        where,
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          imageUrl: true,
          color: true,
          icon: true,
          sortOrder: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              products: true,
            },
          },
        },
      });

      // Calculate pagination metadata
      const totalPages = Math.ceil(total / limit);

      return NextResponse.json({
        data: categories,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasMore: page < totalPages,
        },
      });
    } catch (error) {
      console.error("Error fetching categories:", error);
      return NextResponse.json(
        { error: "Failed to fetch categories" },
        { status: 500 }
      );
    }
  },
  {
    permissions: [Permission.CATEGORY_VIEW],
  }
);

/**
 * POST /api/categories
 * Create a new category
 * Accessible by: Admin users only (CATEGORY_CREATE permission)
 */
export const POST = withRBAC(
  async (request: NextRequest, _context: RBACContext) => {
    try {
      const body = await request.json();

      // Validate request body
      const validationResult = createCategorySchema.safeParse(body);
      if (!validationResult.success) {
        return NextResponse.json(
          {
            error: "Validation failed",
            details: validationResult.error.errors,
          },
          { status: 400 }
        );
      }

      const data = validationResult.data;

      // Check if slug already exists
      const existingCategory = await prisma.category.findUnique({
        where: { slug: data.slug },
      });

      if (existingCategory) {
        return NextResponse.json(
          { error: "A category with this slug already exists" },
          { status: 409 }
        );
      }

      // Create category
      const category = await prisma.category.create({
        data: {
          name: data.name,
          slug: data.slug,
          description: data.description,
          imageUrl: data.imageUrl,
          color: data.color,
          icon: data.icon,
          sortOrder: data.sortOrder,
          isActive: data.isActive,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          imageUrl: true,
          color: true,
          icon: true,
          sortOrder: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return NextResponse.json(
        {
          data: category,
          message: "Category created successfully",
        },
        { status: 201 }
      );
    } catch (error) {
      console.error("Error creating category:", error);
      return NextResponse.json(
        { error: "Failed to create category" },
        { status: 500 }
      );
    }
  },
  {
    permissions: [Permission.CATEGORY_CREATE],
  }
);
