import { NextResponse } from "next/server";
import { db } from "@/db";
import { leads } from "@/db/schema";
import { sql } from "drizzle-orm";

/**
 * GET /api/v1/lead/stats
 *
 * Returns lead statistics aggregated by state for heat map visualization.
 */
export async function GET() {
  try {
    // Get lead counts grouped by state
    const stateCounts = await db
      .select({
        state: leads.state,
        count: sql<number>`count(*)`.as("count"),
      })
      .from(leads)
      .groupBy(leads.state)
      .all();

    // Filter out null states and create a map
    const stateData: Record<string, number> = {};
    let maxCount = 0;

    for (const row of stateCounts) {
      if (row.state) {
        const normalizedState = row.state.toUpperCase().trim();
        stateData[normalizedState] = row.count;
        if (row.count > maxCount) {
          maxCount = row.count;
        }
      }
    }

    // Get total leads count
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(leads)
      .get();

    return NextResponse.json({
      success: true,
      data: {
        byState: stateData,
        maxCount,
        totalLeads: totalResult?.count || 0,
      },
    });
  } catch (error: unknown) {
    console.error("[Lead Stats Error]", error instanceof Error ? error.message : error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
