import { NextRequest, NextResponse } from "next/server";
import { withRBAC } from "@/lib/rbac-middleware";
import { Permission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { toggleAvailabilitySchema } from "@/lib/validations/products";
import type { RBACContext } from "@/types";

/**
 * PATCH /api/products/[id]/availability
 * Toggle product availability status
 * Accessible by: Admin users (PRODUCT_UPDATE permission)
 */
export const PATCH = withRBAC(
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
      const validationResult = toggleAvailabilitySchema.safeParse(body);
      if (!validationResult.success) {
        return NextResponse.json(
          {
            error: "Validation failed",
            details: validationResult.error.errors,
          },
          { status: 400 }
        );
      }

      const { isAvailable } = validationResult.data;

      // Check if product exists
      const product = await prisma.product.findUnique({
        where: { id, deletedAt: null },
      });

      if (!product) {
        return NextResponse.json(
          { error: "Product not found" },
          { status: 404 }
        );
      }

      // Update availability status
      const updatedProduct = await prisma.product.update({
        where: { id },
        data: {
          isAvailable,
        },
        select: {
          id: true,
          name: true,
          sku: true,
          isAvailable: true,
          updatedAt: true,
        },
      });

      return NextResponse.json({
        data: updatedProduct,
        message: `Product ${isAvailable ? "enabled" : "disabled"} successfully`,
      });
    } catch (error) {
      console.error("Error toggling product availability:", error);
      return NextResponse.json(
        { error: "Failed to update product availability" },
        { status: 500 }
      );
    }
  },
  {
    permissions: [Permission.PRODUCT_UPDATE],
  }
);
