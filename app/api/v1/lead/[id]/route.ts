import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { leads, users, messages } from "@/db/schema";
import { eq, and, ne, desc, asc } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/v1/lead/[id]
 *
 * Get a single lead by ID with:
 * - Full lead details
 * - Associated user info
 * - All messages for the lead
 * - Other leads from the same user
 * - Computed fields (speed-to-lead, message counts)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Get lead with user
    const result = await db
      .select({
        lead: leads,
        user: users,
      })
      .from(leads)
      .leftJoin(users, eq(leads.userId, users.id))
      .where(eq(leads.id, id))
      .get();

    if (!result) {
      return NextResponse.json(
        {
          success: false,
          error: "Lead not found",
        },
        { status: 404 }
      );
    }

    const { lead, user } = result;

    // Get all messages for this lead
    const leadMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.leadId, lead.id))
      .orderBy(asc(messages.createdAt))
      .all();

    // Get message counts
    const messageCount = leadMessages.length;
    const inboundCount = leadMessages.filter(
      (m) => m.direction === "inbound"
    ).length;
    const outboundCount = leadMessages.filter(
      (m) => m.direction === "outbound"
    ).length;

    // Compute speed to lead
    const speedToLeadMs =
      lead.processedAt && lead.receivedAt
        ? new Date(lead.processedAt).getTime() -
          new Date(lead.receivedAt).getTime()
        : null;

    // Get other leads from the same user (excluding current lead)
    let otherLeads: Array<{
      id: string;
      category: string | null;
      status: string;
      receivedAt: Date;
      description: string | null;
    }> = [];

    if (user) {
      const otherLeadsResult = await db
        .select({
          id: leads.id,
          category: leads.category,
          status: leads.status,
          receivedAt: leads.receivedAt,
          description: leads.description,
        })
        .from(leads)
        .where(and(eq(leads.userId, user.id), ne(leads.id, lead.id)))
        .orderBy(desc(leads.receivedAt))
        .all();

      otherLeads = otherLeadsResult;
    }

    return NextResponse.json({
      success: true,
      data: {
        lead: {
          ...lead,
          // Computed fields
          speedToLeadMs,
          messageCount,
          inboundCount,
          outboundCount,
          hasResponse: inboundCount > 0,
        },
        user: user
          ? {
              id: user.id,
              email: user.email,
              phone: user.phone,
              firstName: user.firstName,
              lastName: user.lastName,
              createdAt: user.createdAt,
            }
          : null,
        messages: leadMessages,
        otherLeads,
      },
    });
  } catch (error) {
    console.error("[Get Lead Error]", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
