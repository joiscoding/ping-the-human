import { db } from "@/db";
import { leads, duplicateLeads, type Lead, type DuplicateLead } from "@/db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  originalLead: Lead | null;
}

/**
 * Check if a lead is a duplicate based on correlation_id from Angi.
 * 
 * This check should be performed BEFORE inserting a new lead.
 * If a duplicate is detected, the caller should NOT insert the new lead.
 *
 * @param correlationId - The unique correlation ID from Angi
 * @returns Whether it's a duplicate and the original lead if found
 */
export async function checkForDuplicate(
  correlationId: string
): Promise<DuplicateCheckResult> {
  // Check if a lead with this correlation_id already exists
  const existingLead = await db
    .select()
    .from(leads)
    .where(eq(leads.correlationId, correlationId))
    .get();

  // No duplicate found
  if (!existingLead) {
    return {
      isDuplicate: false,
      originalLead: null,
    };
  }

  // Duplicate found - return the original lead
  // Note: We do NOT insert the duplicate into the leads table
  return {
    isDuplicate: true,
    originalLead: existingLead,
  };
}

/**
 * Record a duplicate lead attempt for rebate tracking.
 * Call this AFTER detecting a duplicate to track it for rebate purposes.
 * 
 * @param originalLeadId - The ID of the original lead
 * @param correlationId - The correlation ID that was duplicated
 * @returns The duplicate record created
 */
export async function recordDuplicateAttempt(
  originalLeadId: string,
  correlationId: string
): Promise<DuplicateLead> {
  const duplicateRecord: DuplicateLead = {
    id: uuid(),
    originalLeadId,
    duplicateLeadId: null, // No lead was created for the duplicate
    matchCriteria: "correlation_id",
    detectedAt: new Date(),
    rebateClaimed: false,
    rebateStatus: null,
  };

  await db.insert(duplicateLeads).values(duplicateRecord);

  return duplicateRecord;
}

/**
 * Get all duplicate leads for rebate reporting.
 *
 * @param options - Filter options
 * @returns List of duplicate lead records
 */
export async function getDuplicatesForRebate(options?: {
  unclaimed?: boolean;
  from?: Date;
  to?: Date;
}): Promise<DuplicateLead[]> {
  let query = db.select().from(duplicateLeads);

  // Note: For production, add proper filtering with drizzle-orm conditions
  const results = await query.all();

  return results.filter((record) => {
    if (options?.unclaimed && record.rebateClaimed) {
      return false;
    }
    if (options?.from && record.detectedAt < options.from) {
      return false;
    }
    if (options?.to && record.detectedAt > options.to) {
      return false;
    }
    return true;
  });
}

/**
 * Mark a duplicate as claimed for rebate.
 *
 * @param duplicateId - The duplicate record ID
 * @param status - The rebate status
 */
export async function markRebateClaimed(
  duplicateId: string,
  status: "pending" | "submitted" | "approved" | "rejected"
): Promise<void> {
  await db
    .update(duplicateLeads)
    .set({
      rebateClaimed: true,
      rebateStatus: status,
    })
    .where(eq(duplicateLeads.id, duplicateId));
}
