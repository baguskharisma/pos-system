import { NextRequest, NextResponse } from "next/server";
import { withRBAC } from "@/lib/rbac-middleware";
import { Permission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import {
  createProductSchema,
  productQuerySchema,
} from "@/lib/validations/products";
import type { RBACContext } from "@/types";
import { Prisma } from "@prisma/client";

/**
 * GET /api/products
 * Get list of all products with pagination, filtering, and search
 * Accessible by: All authenticated users with PRODUCT_VIEW permission
 */
export const GET = withRBAC(
  async (request: NextRequest, _context: RBACContext) => {
    try {
      const { searchParams } = new URL(request.url);
      const params = Object.fromEntries(searchParams.entries());

      // Validate query parameters
      const validationResult = productQuerySchema.safeParse(params);
      if (!validationResult.success) {
        return NextResponse.json(
          {
            error: "Invalid query parameters",
            details: validationResult.error.errors,
          },
          { status: 400 }
        );
      }

      const {
        page,
        limit,
        search,
        categoryId,
        isAvailable,
        isFeatured,
        trackInventory,
        minPrice,
        maxPrice,
        tags,
        lowStock,
        sortBy,
        sortOrder,
      } = validationResult.data;

      // Build where clause for filtering
      const where: Prisma.ProductWhereInput = {
        deletedAt: null, // Exclude soft-deleted products
      };

      // Category filter
      if (categoryId) {
        where.categoryId = categoryId;
      }

      // Availability filter
      if (isAvailable !== undefined) {
        where.isAvailable = isAvailable;
      }

      // Featured filter
      if (isFeatured !== undefined) {
        where.isFeatured = isFeatured;
      }

      // Track inventory filter
      if (trackInventory !== undefined) {
        where.trackInventory = trackInventory;
      }

      // Price range filter
      if (minPrice !== undefined || maxPrice !== undefined) {
        where.price = {};
        if (minPrice !== undefined) {
          where.price.gte = minPrice;
        }
        if (maxPrice !== undefined) {
          where.price.lte = maxPrice;
        }
      }

      // Tags filter
      if (tags && tags.length > 0) {
        where.tags = {
          hasSome: tags,
        };
      }

      // Low stock filter
      // Note: For actual low stock filtering (quantity <= lowStockAlert),
      // we need to filter post-query since Prisma doesn't support field comparison
      if (lowStock === true) {
        where.trackInventory = true;
        where.lowStockAlert = { not: null };
      }

      // Search filter (searches in name, description, SKU, barcode)
      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
          { sku: { contains: search, mode: "insensitive" } },
          { barcode: { contains: search, mode: "insensitive" } },
          { tags: { hasSome: [search] } },
        ];
      }

      // Get total count for pagination
      const total = await prisma.product.count({ where });

      // Get paginated products
      let products = await prisma.product.findMany({
        where,
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip: (page - 1) * limit,
        take: lowStock === true ? limit * 2 : limit, // Fetch more if filtering by low stock
        select: {
          id: true,
          categoryId: true,
          sku: true,
          barcode: true,
          name: true,
          description: true,
          price: true,
          costPrice: true,
          compareAtPrice: true,
          taxable: true,
          taxRate: true,
          imageUrl: true,
          images: true,
          trackInventory: true,
          quantity: true,
          lowStockAlert: true,
          isAvailable: true,
          isFeatured: true,
          tags: true,
          createdAt: true,
          updatedAt: true,
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              color: true,
              icon: true,
            },
          },
        },
      });

      // Post-filter for low stock (quantity <= lowStockAlert)
      if (lowStock === true) {
        products = products
          .filter(
            (p) =>
              p.lowStockAlert !== null && p.quantity <= (p.lowStockAlert ?? 0)
          )
          .slice(0, limit);
      }

      // Calculate pagination metadata
      const totalPages = Math.ceil(total / limit);

      return NextResponse.json({
        data: products,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasMore: page < totalPages,
        },
      });
    } catch (error) {
      console.error("Error fetching products:", error);
      return NextResponse.json(
        { error: "Failed to fetch products" },
        { status: 500 }
      );
    }
  },
  {
    permissions: [Permission.PRODUCT_VIEW],
  }
);

/**
 * POST /api/products
 * Create a new product
 * Accessible by: Admin users only (PRODUCT_CREATE permission)
 */
export const POST = withRBAC(
  async (request: NextRequest, _context: RBACContext) => {
    try {
      const body = await request.json();

      // Validate request body
      const validationResult = createProductSchema.safeParse(body);
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
      const category = await prisma.category.findUnique({
        where: { id: data.categoryId },
      });

      if (!category) {
        return NextResponse.json(
          { error: "Category not found" },
          { status: 404 }
        );
      }

      if (!category.isActive) {
        return NextResponse.json(
          { error: "Cannot create product in inactive category" },
          { status: 400 }
        );
      }

      // Check if SKU already exists
      const existingProductBySku = await prisma.product.findUnique({
        where: { sku: data.sku },
      });

      if (existingProductBySku) {
        return NextResponse.json(
          { error: "A product with this SKU already exists" },
          { status: 409 }
        );
      }

      // Check if barcode already exists (if provided)
      if (data.barcode) {
        const existingProductByBarcode = await prisma.product.findUnique({
          where: { barcode: data.barcode },
        });

        if (existingProductByBarcode) {
          return NextResponse.json(
            { error: "A product with this barcode already exists" },
            { status: 409 }
          );
        }
      }

      // Create product
      const product = await prisma.product.create({
        data: {
          categoryId: data.categoryId,
          sku: data.sku,
          barcode: data.barcode,
          name: data.name,
          description: data.description,
          price: data.price,
          costPrice: data.costPrice,
          compareAtPrice: data.compareAtPrice,
          taxable: data.taxable,
          taxRate: data.taxRate,
          imageUrl: data.imageUrl,
          images: data.images as Prisma.InputJsonValue,
          trackInventory: data.trackInventory,
          quantity: data.quantity,
          lowStockAlert: data.lowStockAlert,
          isAvailable: data.isAvailable,
          isFeatured: data.isFeatured,
          metaTitle: data.metaTitle,
          metaDescription: data.metaDescription,
          tags: data.tags,
          variants: data.variants as Prisma.InputJsonValue,
          customFields: data.customFields as Prisma.InputJsonValue,
        },
        select: {
          id: true,
          categoryId: true,
          sku: true,
          barcode: true,
          name: true,
          description: true,
          price: true,
          costPrice: true,
          compareAtPrice: true,
          taxable: true,
          taxRate: true,
          imageUrl: true,
          images: true,
          trackInventory: true,
          quantity: true,
          lowStockAlert: true,
          isAvailable: true,
          isFeatured: true,
          metaTitle: true,
          metaDescription: true,
          tags: true,
          variants: true,
          customFields: true,
          createdAt: true,
          updatedAt: true,
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              color: true,
              icon: true,
            },
          },
        },
      });

      return NextResponse.json(
        {
          data: product,
          message: "Product created successfully",
        },
        { status: 201 }
      );
    } catch (error) {
      console.error("Error creating product:", error);
      return NextResponse.json(
        { error: "Failed to create product" },
        { status: 500 }
      );
    }
  },
  {
    permissions: [Permission.PRODUCT_CREATE],
  }
);
