import { NextResponse } from "next/server";
import { getApiDocs } from "@/lib/swagger";

/**
 * GET /api/docs
 * Returns the OpenAPI specification
 */
export async function GET() {
  try {
    const spec = getApiDocs();

    return NextResponse.json(spec, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600", // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error("Error generating API docs:", error);

    return NextResponse.json(
      { error: "Failed to generate API documentation" },
      { status: 500 }
    );
  }
}
