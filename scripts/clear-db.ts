/**
 * Clear all database tables
 * Run with: pnpm tsx scripts/clear-db.ts
 */

import { db } from "../db";
import { duplicateLeads, messages, leads, users } from "../db/schema";

async function clearDb() {
  console.log("🗑️  Clearing database...\n");

  // Delete in order due to foreign key constraints
  const dupCount = await db.delete(duplicateLeads).returning();
  console.log(`   Deleted ${dupCount.length} duplicate_leads`);

  const msgCount = await db.delete(messages).returning();
  console.log(`   Deleted ${msgCount.length} messages`);

  const leadCount = await db.delete(leads).returning();
  console.log(`   Deleted ${leadCount.length} leads`);

  const userCount = await db.delete(users).returning();
  console.log(`   Deleted ${userCount.length} users`);

  console.log("\n✅ Database cleared successfully!");
}

clearDb().catch(console.error);
