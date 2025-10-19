import { NextRequest, NextResponse } from "next/server";
import { withRBAC } from "@/lib/rbac-middleware";
import { Permission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { updateProductSchema } from "@/lib/validations/products";
import type { RBACContext } from "@/types";
import { Prisma } from "@prisma/client";

/**
 * GET /api/products/[id]
 * Get a single product by ID
 * Accessible by: All authenticated users with PRODUCT_VIEW permission
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
          { error: "Invalid product ID format" },
          { status: 400 }
        );
      }

      const product = await prisma.product.findUnique({
        where: { id, deletedAt: null },
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
              description: true,
              imageUrl: true,
              color: true,
              icon: true,
              isActive: true,
            },
          },
          _count: {
            select: {
              orderItems: true,
            },
          },
        },
      });

      if (!product) {
        return NextResponse.json(
          { error: "Product not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({ data: product });
    } catch (error) {
      console.error("Error fetching product:", error);
      return NextResponse.json(
        { error: "Failed to fetch product" },
        { status: 500 }
      );
    }
  },
  {
    permissions: [Permission.PRODUCT_VIEW],
  }
);

/**
 * PUT /api/products/[id]
 * Update a product
 * Accessible by: Admin users only (PRODUCT_UPDATE permission)
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
          { error: "Invalid product ID format" },
          { status: 400 }
        );
      }

      const body = await request.json();

      // Validate request body
      const validationResult = updateProductSchema.safeParse(body);
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

      // Check if product exists
      const existingProduct = await prisma.product.findUnique({
        where: { id, deletedAt: null },
      });

      if (!existingProduct) {
        return NextResponse.json(
          { error: "Product not found" },
          { status: 404 }
        );
      }

      // If category is being updated, check if it exists and is active
      if (data.categoryId) {
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
            { error: "Cannot assign product to inactive category" },
            { status: 400 }
          );
        }
      }

      // If SKU is being updated, check if new SKU already exists
      if (data.sku && data.sku !== existingProduct.sku) {
        const skuExists = await prisma.product.findUnique({
          where: { sku: data.sku },
        });

        if (skuExists) {
          return NextResponse.json(
            { error: "A product with this SKU already exists" },
            { status: 409 }
          );
        }
      }

      // If barcode is being updated, check if new barcode already exists
      if (
        data.barcode &&
        data.barcode !== existingProduct.barcode
      ) {
        const barcodeExists = await prisma.product.findUnique({
          where: { barcode: data.barcode },
        });

        if (barcodeExists) {
          return NextResponse.json(
            { error: "A product with this barcode already exists" },
            { status: 409 }
          );
        }
      }

      // Build update data object
      const updateData: Prisma.ProductUpdateInput = {};

      if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
      if (data.sku !== undefined) updateData.sku = data.sku;
      if (data.barcode !== undefined) updateData.barcode = data.barcode;
      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.price !== undefined) updateData.price = data.price;
      if (data.costPrice !== undefined) updateData.costPrice = data.costPrice;
      if (data.compareAtPrice !== undefined) updateData.compareAtPrice = data.compareAtPrice;
      if (data.taxable !== undefined) updateData.taxable = data.taxable;
      if (data.taxRate !== undefined) updateData.taxRate = data.taxRate;
      if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
      if (data.images !== undefined) updateData.images = data.images as Prisma.InputJsonValue;
      if (data.trackInventory !== undefined) updateData.trackInventory = data.trackInventory;
      if (data.quantity !== undefined) updateData.quantity = data.quantity;
      if (data.lowStockAlert !== undefined) updateData.lowStockAlert = data.lowStockAlert;
      if (data.isAvailable !== undefined) updateData.isAvailable = data.isAvailable;
      if (data.isFeatured !== undefined) updateData.isFeatured = data.isFeatured;
      if (data.metaTitle !== undefined) updateData.metaTitle = data.metaTitle;
      if (data.metaDescription !== undefined) updateData.metaDescription = data.metaDescription;
      if (data.tags !== undefined) updateData.tags = data.tags;
      if (data.variants !== undefined) updateData.variants = data.variants as Prisma.InputJsonValue;
      if (data.customFields !== undefined) updateData.customFields = data.customFields as Prisma.InputJsonValue;

      // Update product
      const updatedProduct = await prisma.product.update({
        where: { id },
        data: updateData,
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

      return NextResponse.json({
        data: updatedProduct,
        message: "Product updated successfully",
      });
    } catch (error) {
      console.error("Error updating product:", error);
      return NextResponse.json(
        { error: "Failed to update product" },
        { status: 500 }
      );
    }
  },
  {
    permissions: [Permission.PRODUCT_UPDATE],
  }
);

/**
 * PATCH /api/products/[id]
 * Partially update a product
 * Accessible by: Admin users only (PRODUCT_UPDATE permission)
 */
export const PATCH = PUT;

/**
 * DELETE /api/products/[id]
 * Soft delete a product
 * Accessible by: Admin users only (PRODUCT_DELETE permission)
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
          { error: "Invalid product ID format" },
          { status: 400 }
        );
      }

      // Check if product exists
      const product = await prisma.product.findUnique({
        where: { id, deletedAt: null },
        include: {
          _count: {
            select: {
              orderItems: true,
            },
          },
        },
      });

      if (!product) {
        return NextResponse.json(
          { error: "Product not found" },
          { status: 404 }
        );
      }

      // Check if product has order items
      if (product._count.orderItems > 0) {
        return NextResponse.json(
          {
            error: "Cannot delete product with existing orders",
            details: [
              {
                message: `This product has ${product._count.orderItems} order item(s). Products with order history cannot be deleted to maintain data integrity. Consider marking it as unavailable instead.`,
              },
            ],
          },
          { status: 409 }
        );
      }

      // Soft delete the product
      await prisma.product.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          isAvailable: false,
        },
      });

      return NextResponse.json({
        message: "Product deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting product:", error);
      return NextResponse.json(
        { error: "Failed to delete product" },
        { status: 500 }
      );
    }
  },
  {
    permissions: [Permission.PRODUCT_DELETE],
  }
);
