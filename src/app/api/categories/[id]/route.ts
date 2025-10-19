import { NextRequest, NextResponse } from "next/server";
import { withRBAC } from "@/lib/rbac-middleware";
import { Permission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { updateCategorySchema } from "@/lib/validations/categories";
import type { RBACContext } from "@/types";

/**
 * GET /api/categories/[id]
 * Get a single category by ID
 * Accessible by: All authenticated users with CATEGORY_VIEW permission
 */
export const GET = withRBAC(
  async (
    request: NextRequest,
    context: RBACContext & { params: Promise<{ id: string }> }
  ) => {
    try {
      const { id } = await context.params;

      // Validate UUID format
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        return NextResponse.json(
          { error: "Invalid category ID format" },
          { status: 400 }
        );
      }

      const category = await prisma.category.findUnique({
        where: { id },
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

      if (!category) {
        return NextResponse.json(
          { error: "Category not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({ data: category });
    } catch (error) {
      console.error("Error fetching category:", error);
      return NextResponse.json(
        { error: "Failed to fetch category" },
        { status: 500 }
      );
    }
  },
  {
    permissions: [Permission.CATEGORY_VIEW],
  }
);

/**
 * PUT /api/categories/[id]
 * Update a category
 * Accessible by: Admin users only (CATEGORY_UPDATE permission)
 */
export const PUT = withRBAC(
  async (
    request: NextRequest,
    context: RBACContext & { params: Promise<{ id: string }> }
  ) => {
    try {
      const { id } = await context.params;

      // Validate UUID format
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        return NextResponse.json(
          { error: "Invalid category ID format" },
          { status: 400 }
        );
      }

      const body = await request.json();

      // Validate request body
      const validationResult = updateCategorySchema.safeParse(body);
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

      // Check if category exists
      const existingCategory = await prisma.category.findUnique({
        where: { id },
      });

      if (!existingCategory) {
        return NextResponse.json(
          { error: "Category not found" },
          { status: 404 }
        );
      }

      // If slug is being updated, check if new slug already exists
      if (data.slug && data.slug !== existingCategory.slug) {
        const slugExists = await prisma.category.findUnique({
          where: { slug: data.slug },
        });

        if (slugExists) {
          return NextResponse.json(
            { error: "A category with this slug already exists" },
            { status: 409 }
          );
        }
      }

      // Update category
      const updatedCategory = await prisma.category.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.slug !== undefined && { slug: data.slug }),
          ...(data.description !== undefined && {
            description: data.description,
          }),
          ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
          ...(data.color !== undefined && { color: data.color }),
          ...(data.icon !== undefined && { icon: data.icon }),
          ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
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

      return NextResponse.json({
        data: updatedCategory,
        message: "Category updated successfully",
      });
    } catch (error) {
      console.error("Error updating category:", error);
      return NextResponse.json(
        { error: "Failed to update category" },
        { status: 500 }
      );
    }
  },
  {
    permissions: [Permission.CATEGORY_UPDATE],
  }
);

/**
 * PATCH /api/categories/[id]
 * Partially update a category
 * Accessible by: Admin users only (CATEGORY_UPDATE permission)
 */
export const PATCH = PUT;

/**
 * DELETE /api/categories/[id]
 * Soft delete a category
 * Accessible by: Admin users only (CATEGORY_DELETE permission)
 */
export const DELETE = withRBAC(
  async (
    request: NextRequest,
    context: RBACContext & { params: Promise<{ id: string }> }
  ) => {
    try {
      const { id } = await context.params;

      // Validate UUID format
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        return NextResponse.json(
          { error: "Invalid category ID format" },
          { status: 400 }
        );
      }

      // Check if category exists
      const category = await prisma.category.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              products: true,
            },
          },
        },
      });

      if (!category) {
        return NextResponse.json(
          { error: "Category not found" },
          { status: 404 }
        );
      }

      // Check if category has products
      if (category._count.products > 0) {
        return NextResponse.json(
          {
            error: "Cannot delete category with existing products",
            details: [
              {
                message: `This category has ${category._count.products} product(s). Please reassign or delete the products before deleting this category.`,
              },
            ],
          },
          { status: 409 }
        );
      }

      // Soft delete the category
      await prisma.category.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          isActive: false,
        },
      });

      return NextResponse.json({
        message: "Category deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting category:", error);
      return NextResponse.json(
        { error: "Failed to delete category" },
        { status: 500 }
      );
    }
  },
  {
    permissions: [Permission.CATEGORY_DELETE],
  }
);
