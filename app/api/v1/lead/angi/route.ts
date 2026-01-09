import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { leads, duplicateLeads, type Lead } from "@/db/schema";
import { AngiLeadSchema, type LeadResponse } from "@/lib/schemas";
import { findOrCreateUser } from "@/lib/user-matcher";
import { sendIntroMessage } from "@/lib/messaging";
import { v4 as uuid } from "uuid";
import { eq } from "drizzle-orm";

/**
 * POST /api/v1/lead/angi
 *
 * Endpoint for Angi to send leads.
 *
 * Flow:
 * 1. Validate incoming payload with Zod
 * 2. Check for duplicate via correlation_id FIRST
 * 3. Find or create user (email OR phone matching)
 * 4. If duplicate: create duplicate record, return early
 * 5. If new: create lead record, send intro email to user
 * 6. Return response with speed-to-lead metrics and email status
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

    // Check for duplicate FIRST (before inserting)
    const existingLead = await db
      .select()
      .from(leads)
      .where(eq(leads.correlationId, angiLead.CorrelationId))
      .get();

    // Find or create user
    const { user, isNew: isNewUser } = await findOrCreateUser(
      angiLead.Email,
      angiLead.PhoneNumber,
      angiLead.FirstName,
      angiLead.LastName
    );

    // If duplicate found, create duplicate record and return
    if (existingLead) {
      const duplicateLeadId = uuid();

      // Create a lead record marked as duplicate (with null correlationId to avoid constraint)
      const duplicateLead: Lead = {
        id: duplicateLeadId,
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
        correlationId: null, // Set to null to avoid UNIQUE constraint
        alAccountId: angiLead.ALAccountId,
        status: "duplicate",
        converted: false,
        receivedAt,
        processedAt: new Date(),
      };

      await db.insert(leads).values(duplicateLead);

      // Create duplicate tracking record
      await db.insert(duplicateLeads).values({
        id: uuid(),
        originalLeadId: existingLead.id,
        duplicateLeadId: duplicateLeadId,
        matchCriteria: "correlation_id",
        detectedAt: new Date(),
        rebateClaimed: false,
        rebateStatus: null,
      });

      console.log(
        `[Duplicate Detected] New: ${duplicateLeadId}, Original: ${existingLead.id}, CorrelationId: ${angiLead.CorrelationId}`
      );

      const response: LeadResponse = {
        success: true,
        leadId: duplicateLeadId,
        userId: user.id,
        isDuplicate: true,
        speedToLeadMs: null,
        messageId: undefined,
      };

      return NextResponse.json(response, { status: 201 });
    }

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
