import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { leads, type Lead } from "@/db/schema";
import { AngiLeadSchema, type LeadResponse } from "@/lib/schemas";
import { findOrCreateUser } from "@/lib/user-matcher";
import { checkForDuplicate } from "@/lib/duplicate-detector";
import { draftIntroMessage } from "@/lib/messaging";
import { v4 as uuid } from "uuid";
import { eq } from "drizzle-orm";

/**
 * POST /api/v1/lead/angi
 *
 * Endpoint for Angi to send leads.
 *
 * Flow:
 * 1. Validate incoming payload with Zod
 * 2. Find or create user (email OR phone matching)
 * 3. Create lead record
 * 4. Check for duplicate via correlation_id
 * 5. If not duplicate, draft intro email
 * 6. Return response with speed-to-lead metrics
 */
export async function POST(request: NextRequest) {
  const receivedAt = new Date();

  try {
    // Parse and validate request body
    const body = await request.json();
    const parseResult = AngiLeadSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid payload",
          details: parseResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const angiLead = parseResult.data;

    // Find or create user
    const { user, isNew: isNewUser } = await findOrCreateUser(
      angiLead.Email,
      angiLead.PhoneNumber,
      angiLead.FirstName,
      angiLead.LastName
    );

    // Create lead record
    const leadId = uuid();
    const newLead: Lead = {
      id: leadId,
      userId: user.id,
      addressLine1: angiLead.PostalAddress.AddressFirstLine,
      addressLine2: angiLead.PostalAddress.AddressSecondLine || null,
      city: angiLead.PostalAddress.City,
      state: angiLead.PostalAddress.State,
      postalCode: angiLead.PostalAddress.PostalCode,
      source: angiLead.Source,
      description: angiLead.Description,
      category: angiLead.Category,
      urgency: angiLead.Urgency,
      correlationId: angiLead.CorrelationId,
      alAccountId: angiLead.ALAccountId,
      status: "pending",
      converted: false,
      receivedAt,
      processedAt: null,
    };

    await db.insert(leads).values(newLead);

    // Check for duplicate
    const duplicateCheck = await checkForDuplicate(
      angiLead.CorrelationId,
      leadId
    );

    let messageId: string | undefined;
    let processedAt: Date | null = null;

    if (!duplicateCheck.isDuplicate) {
      // Draft intro message for non-duplicate leads
      const message = await draftIntroMessage(newLead, user);
      messageId = message.id;
      processedAt = new Date();

      // Update lead as processed
      await db
        .update(leads)
        .set({ status: "processed", processedAt })
        .where(eq(leads.id, leadId));
    }

    // Calculate speed to lead (time from received to processed)
    const speedToLeadMs = processedAt
      ? processedAt.getTime() - receivedAt.getTime()
      : null;

    const response: LeadResponse = {
      success: true,
      leadId,
      userId: user.id,
      isDuplicate: duplicateCheck.isDuplicate,
      speedToLeadMs,
      messageId,
    };

    console.log(
      `[Lead Received] ID: ${leadId}, User: ${user.id} (${isNewUser ? "new" : "existing"}), Duplicate: ${duplicateCheck.isDuplicate}, Speed: ${speedToLeadMs}ms`
    );

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("[Lead Error]", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
