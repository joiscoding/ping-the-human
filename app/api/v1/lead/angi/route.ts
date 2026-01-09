import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { leads, type Lead } from "@/db/schema";
import { AngiLeadSchema, type LeadResponse } from "@/lib/schemas";
import { findOrCreateUser } from "@/lib/user-matcher";
import { sendIntroMessage } from "@/lib/messaging";
import { checkForDuplicate, recordDuplicateAttempt } from "@/lib/duplicate-detector";
import { v4 as uuid } from "uuid";
import { eq } from "drizzle-orm";

/**
 * POST /api/v1/lead/angi
 *
 * Endpoint for Angi to send leads.
 *
 * Flow:
 * 1. Validate incoming payload with Zod
 * 2. Check for duplicate via correlation_id - if duplicate, return early (no DB insert)
 * 3. Find or create user (email OR phone matching)
 * 4. Create lead record, send intro email to user
 * 5. Return response with speed-to-lead metrics and email status
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

    // Check for duplicate FIRST (before creating user or lead)
    const duplicateCheck = await checkForDuplicate(angiLead.CorrelationId);

    // If duplicate found, record it for rebate tracking and return early WITHOUT inserting
    if (duplicateCheck.isDuplicate && duplicateCheck.originalLead) {
      console.log(
        `[Duplicate Detected] Original: ${duplicateCheck.originalLead.id}, CorrelationId: ${angiLead.CorrelationId}`
      );

      // Record the duplicate attempt for rebate tracking (without inserting into leads table)
      await recordDuplicateAttempt(duplicateCheck.originalLead.id, angiLead.CorrelationId);

      const response: LeadResponse = {
        success: true,
        leadId: duplicateCheck.originalLead.id,
        userId: duplicateCheck.originalLead.userId,
        isDuplicate: true,
        speedToLeadMs: null,
        messageId: undefined,
      };

      return NextResponse.json(response, { status: 200 });
    }

    // Not a duplicate - find or create user
    const { user, isNew: isNewUser } = await findOrCreateUser(
      angiLead.Email,
      angiLead.PhoneNumber,
      angiLead.FirstName,
      angiLead.LastName
    );

    // Not a duplicate - create new lead
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

    // Send intro message (draft + send email)
    const sendResult = await sendIntroMessage(newLead, user);
    const processedAt = new Date();

    // Update lead status based on email result
    const newStatus = sendResult.success ? "processed" : "pending";
    await db
      .update(leads)
      .set({ status: newStatus, processedAt })
      .where(eq(leads.id, leadId));

    // Calculate speed to lead (time from received to processed)
    const speedToLeadMs = processedAt.getTime() - receivedAt.getTime();

    // Log email send result
    if (sendResult.success) {
      console.log(
        `[Email Sent] Lead: ${leadId}, Message: ${sendResult.message?.id}, To: ${user.email}`
      );
    } else {
      console.warn(
        `[Email Failed] Lead: ${leadId}, Error: ${sendResult.error}`
      );
    }

    const response: LeadResponse = {
      success: true,
      leadId,
      userId: user.id,
      isDuplicate: false,
      speedToLeadMs,
      messageId: sendResult.message?.id,
      emailSent: sendResult.success,
    };

    console.log(
      `[Lead Received] ID: ${leadId}, User: ${user.id} (${isNewUser ? "new" : "existing"}), Speed: ${speedToLeadMs}ms`
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
