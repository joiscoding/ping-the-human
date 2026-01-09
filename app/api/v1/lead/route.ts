import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { leads, users, messages } from "@/db/schema";
import { LeadQuerySchema } from "@/lib/schemas";
import { eq, and, gte, lte, sql, desc } from "drizzle-orm";

/**
 * GET /api/v1/lead
 *
 * List leads with filtering, pagination, and computed fields.
 *
 * Query parameters:
 * - status: Filter by status (pending, processed, duplicate)
 * - source: Filter by lead source
 * - userId: Filter by user ID
 * - from: Filter by received date (ISO datetime)
 * - to: Filter by received date (ISO datetime)
 * - limit: Number of results (default 50, max 100)
 * - offset: Pagination offset (default 0)
 */
export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams = {
      status: searchParams.get("status") || undefined,
      source: searchParams.get("source") || undefined,
      userId: searchParams.get("userId") || undefined,
      from: searchParams.get("from") || undefined,
      to: searchParams.get("to") || undefined,
      limit: searchParams.get("limit") || "50",
      offset: searchParams.get("offset") || "0",
    };

    // Validate query parameters
    const parseResult = LeadQuerySchema.safeParse(queryParams);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid query parameters",
          details: parseResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { status, source, userId, from, to, limit, offset } =
      parseResult.data;

    // Build conditions array
    const conditions = [];

    if (status) {
      conditions.push(eq(leads.status, status));
    }

    if (source) {
      conditions.push(eq(leads.source, source));
    }

    if (userId) {
      conditions.push(eq(leads.userId, userId));
    }

    if (from) {
      conditions.push(gte(leads.receivedAt, new Date(from)));
    }

    if (to) {
      conditions.push(lte(leads.receivedAt, new Date(to)));
    }

    // Execute query with joins
    const results = await db
      .select({
        lead: leads,
        user: users,
      })
      .from(leads)
      .leftJoin(users, eq(leads.userId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(leads.receivedAt))
      .limit(limit)
      .offset(offset)
      .all();

    // Get message counts for each lead
    const leadsWithMessages = await Promise.all(
      results.map(async ({ lead, user }) => {
        const messageCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(messages)
          .where(eq(messages.leadId, lead.id))
          .get();

        const inboundCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(messages)
          .where(
            and(eq(messages.leadId, lead.id), eq(messages.direction, "inbound"))
          )
          .get();

        return {
          ...lead,
          user: user
            ? {
                id: user.id,
                email: user.email,
                phone: user.phone,
                firstName: user.firstName,
                lastName: user.lastName,
              }
            : null,
          // Computed fields (speedToLeadMs is now stored in DB)
          messageCount: messageCount?.count || 0,
          hasResponse: (inboundCount?.count || 0) > 0,
        };
      })
    );

    // Get total count for pagination
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(leads)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .get();

    return NextResponse.json({
      success: true,
      data: leadsWithMessages,
      pagination: {
        total: totalResult?.count || 0,
        limit,
        offset,
        hasMore: offset + limit < (totalResult?.count || 0),
      },
    });
  } catch (error) {
    console.error("[Lead List Error]", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
