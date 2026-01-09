import { db } from "@/db";
import { leads, duplicateLeads, type Lead, type DuplicateLead } from "@/db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  originalLead: Lead | null;
  duplicateRecord: DuplicateLead | null;
}

/**
 * Check if a lead is a duplicate based on correlation_id from Angi.
 *
 * @param correlationId - The unique correlation ID from Angi
 * @param newLeadId - The ID of the new lead being processed
 * @returns Whether it's a duplicate, the original lead, and the duplicate record
 */
export async function checkForDuplicate(
  correlationId: string,
  newLeadId: string
): Promise<DuplicateCheckResult> {
  // Check if a lead with this correlation_id already exists
  const existingLead = await db
    .select()
    .from(leads)
    .where(eq(leads.correlationId, correlationId))
    .get();

  // No duplicate found
  if (!existingLead || existingLead.id === newLeadId) {
    return {
      isDuplicate: false,
      originalLead: null,
      duplicateRecord: null,
    };
  }

  // Create duplicate record for rebate tracking
  const duplicateRecord: DuplicateLead = {
    id: uuid(),
    originalLeadId: existingLead.id,
    duplicateLeadId: newLeadId,
    matchCriteria: "correlation_id",
    detectedAt: new Date(),
    rebateClaimed: false,
    rebateStatus: null,
  };

  await db.insert(duplicateLeads).values(duplicateRecord);

  // Update the new lead status to 'duplicate'
  await db
    .update(leads)
    .set({ status: "duplicate" })
    .where(eq(leads.id, newLeadId));

  return {
    isDuplicate: true,
    originalLead: existingLead,
    duplicateRecord,
  };
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
