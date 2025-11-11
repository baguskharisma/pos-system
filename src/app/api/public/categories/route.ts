import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/public/categories
 * Get list of active categories for public menu
 * No authentication required
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeProductCount = searchParams.get("includeProductCount") === "true";

    // Get all active categories sorted by sortOrder
    const categories = await prisma.category.findMany({
      where: {
        isActive: true,
        deletedAt: null,
      },
      orderBy: {
        sortOrder: "asc",
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
        ...(includeProductCount && {
          _count: {
            select: {
              products: {
                where: {
                  isAvailable: true,
                  deletedAt: null,
                },
              },
            },
          },
        }),
      },
    });

    return NextResponse.json({
      data: categories,
      total: categories.length,
    });
  } catch (error) {
    console.error("Error fetching public categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}
