/**
 * Demo E2E Test: 5 Users Scenario
 *
 * This script simulates 5 POST requests to demonstrate:
 * - 1 duplicate lead (same correlation ID - flagged as duplicate)
 * - 2 leads from same user (same email/phone - matches existing user)
 * - 2 unique leads (creates new users)
 *
 * Run with: npm run test:demo
 */

import type { AngiLead } from "@/lib/schemas";

const API_URL = process.env.API_URL || "http://localhost:3000";

// ============================================
// Test Data: 5 Leads
// ============================================

// Generate valid UUIDs for correlation IDs
const SHARED_CORRELATION_ID = crypto.randomUUID();
const EMMA_CORRELATION_ID_1 = crypto.randomUUID();
const EMMA_CORRELATION_ID_2 = crypto.randomUUID();
const ALEX_CORRELATION_ID = crypto.randomUUID();

// Shared person details for same-user matching
const SAME_PERSON = {
  FirstName: "Emma",
  LastName: "Wilson",
  PhoneNumber: "5551112222",
  Email: "emma.wilson@demo.com",
};

/**
 * Lead 1: Unique lead from John (creates new user)
 */
const lead1_unique: AngiLead = {
  FirstName: "John",
  LastName: "Doe",
  PhoneNumber: "5553334444",
  PostalAddress: {
    AddressFirstLine: "100 First Ave",
    AddressSecondLine: "",
    City: "New York",
    State: "NY",
    PostalCode: "10001",
  },
  Email: "john.doe@demo.com",
  Source: "Angi's List Quote Request",
  Description: "Looking for house cleaning services",
  Category: "New York – House Cleaning",
  Urgency: "This Week",
  CorrelationId: SHARED_CORRELATION_ID,
  ALAccountId: "DEMO001",
};

/**
 * Lead 2: Duplicate of Lead 1 (same correlation ID - should be flagged)
 */
const lead2_duplicate: AngiLead = {
  ...lead1_unique,
  Description: "Re-submitting cleaning request",
};

/**
 * Lead 3: First lead from Emma (creates new user)
 */
const lead3_emma_first: AngiLead = {
  ...SAME_PERSON,
  PostalAddress: {
    AddressFirstLine: "200 Oak Street",
    AddressSecondLine: "Apt 5B",
    City: "Los Angeles",
    State: "CA",
    PostalCode: "90001",
  },
  Source: "Angi's List Quote Request",
  Description: "Need lawn care service",
  Category: "Los Angeles – Lawn Care",
  Urgency: "Within 2 Weeks",
  CorrelationId: EMMA_CORRELATION_ID_1,
  ALAccountId: "DEMO002",
};

/**
 * Lead 4: Second lead from Emma (same email/phone - should match existing user)
 */
const lead4_emma_second: AngiLead = {
  ...SAME_PERSON,
  PostalAddress: {
    AddressFirstLine: "200 Oak Street",
    AddressSecondLine: "Apt 5B",
    City: "Los Angeles",
    State: "CA",
    PostalCode: "90001",
  },
  Source: "Angi's List Quote Request",
  Description: "Also need pool cleaning",
  Category: "Los Angeles – Pool Cleaning",
  Urgency: "Flexible",
  CorrelationId: EMMA_CORRELATION_ID_2,
  ALAccountId: "DEMO003",
};

/**
 * Lead 5: Unique lead from Alex (creates new user)
 */
const lead5_unique: AngiLead = {
  FirstName: "Alex",
  LastName: "Chen",
  PhoneNumber: "5556667777",
  PostalAddress: {
    AddressFirstLine: "300 Pine Road",
    AddressSecondLine: "",
    City: "Seattle",
    State: "WA",
    PostalCode: "98101",
  },
  Email: "alex.chen@demo.com",
  Source: "Angi's List Quote Request",
  Description: "Kitchen remodeling project",
  Category: "Seattle – Remodeling",
  Urgency: "Within 1 Month",
  CorrelationId: ALEX_CORRELATION_ID,
  ALAccountId: "DEMO004",
};

// ============================================
// Test Configuration
// ============================================

interface DemoLead {
  name: string;
  scenario: "unique" | "duplicate" | "same_user";
  payload: AngiLead;
}

const demoLeads: DemoLead[] = [
  {
    name: "Lead 1 - John Doe (Unique)",
    scenario: "unique",
    payload: lead1_unique,
  },
  {
    name: "Lead 2 - Duplicate of Lead 1",
    scenario: "duplicate",
    payload: lead2_duplicate,
  },
  {
    name: "Lead 3 - Emma Wilson (Unique)",
    scenario: "unique",
    payload: lead3_emma_first,
  },
  {
    name: "Lead 4 - Emma Wilson Again (Same User)",
    scenario: "same_user",
    payload: lead4_emma_second,
  },
  {
    name: "Lead 5 - Alex Chen (Unique)",
    scenario: "unique",
    payload: lead5_unique,
  },
];

// ============================================
// Test Runner
// ============================================

interface TestResult {
  name: string;
  scenario: string;
  success: boolean;
  isDuplicate: boolean;
  userId: string | null;
  leadId: string | null;
  speedToLeadMs: number | null;
  emailSent: boolean | null;
  error?: string;
}

async function runDemo(): Promise<void> {
  console.log("\n🎬 DEMO E2E TEST: 5 Users Scenario");
  console.log("===================================\n");
  console.log(`📍 API URL: ${API_URL}/api/v1/lead/angi\n`);
  console.log("Scenarios:");
  console.log("  • 1 duplicate lead (same correlation ID)");
  console.log("  • 2 leads from same user (same email/phone)");
  console.log("  • 2 unique leads\n");
  console.log("─".repeat(50) + "\n");

  const results: TestResult[] = [];
  const userIdMap = new Map<string, string>(); // email -> userId

  for (let i = 0; i < demoLeads.length; i++) {
    const demo = demoLeads[i];
    console.log(`[${i + 1}/5] ${demo.name}`);
    console.log(`     📋 Scenario: ${demo.scenario}`);

    try {
      const response = await fetch(`${API_URL}/api/v1/lead/angi`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(demo.payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        console.log(`     ❌ Error: ${data.error || "Request failed"}`);
        if (data.details) {
          console.log(`     📋 Details: ${JSON.stringify(data.details, null, 2)}`);
        }
        results.push({
          name: demo.name,
          scenario: demo.scenario,
          success: false,
          isDuplicate: false,
          userId: null,
          leadId: null,
          speedToLeadMs: null,
          emailSent: null,
          error: data.error,
        });
        console.log("");
        continue;
      }

      // Track user IDs to verify same-user matching
      const email = demo.payload.Email;
      const existingUserId = userIdMap.get(email);
      const isMatchedUser = existingUserId && data.userId === existingUserId;
      
      if (!existingUserId) {
        userIdMap.set(email, data.userId);
      }

      // Determine actual result
      let actualResult: string;
      let icon: string;

      if (data.isDuplicate) {
        actualResult = "duplicate";
        icon = "🔁";
      } else if (isMatchedUser) {
        actualResult = "same_user";
        icon = "👥";
      } else {
        actualResult = "unique";
        icon = "✨";
      }

      const passed = actualResult === demo.scenario;
      const statusIcon = passed ? "✅" : "⚠️";

      console.log(`     ${icon} Result: ${actualResult} ${statusIcon}`);
      console.log(`     🆔 Lead ID: ${data.leadId}`);
      console.log(`     👤 User ID: ${data.userId}${isMatchedUser ? " (matched existing)" : ""}`);
      
      if (data.speedToLeadMs !== null && data.speedToLeadMs !== undefined) {
        console.log(`     ⚡ Speed to Lead: ${data.speedToLeadMs}ms`);
      }
      
      if (data.emailSent !== undefined) {
        const emailIcon = data.emailSent ? "📧" : "📭";
        console.log(`     ${emailIcon} Email Sent: ${data.emailSent}`);
      }

      results.push({
        name: demo.name,
        scenario: demo.scenario,
        success: true,
        isDuplicate: data.isDuplicate,
        userId: data.userId,
        leadId: data.leadId,
        speedToLeadMs: data.speedToLeadMs,
        emailSent: data.emailSent ?? null,
      });
    } catch (error) {
      console.log(`     ❌ Error: ${error}`);
      results.push({
        name: demo.name,
        scenario: demo.scenario,
        success: false,
        isDuplicate: false,
        userId: null,
        leadId: null,
        speedToLeadMs: null,
        emailSent: null,
        error: String(error),
      });
    }

    console.log("");
  }

  // ============================================
  // Summary
  // ============================================
  console.log("─".repeat(50));
  console.log("\n📊 DEMO SUMMARY");
  console.log("===============\n");

  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  console.log(`Total Requests:     ${results.length}`);
  console.log(`Successful:         ${successful.length} ✅`);
  console.log(`Failed:             ${failed.length} ❌`);
  console.log("");

  // Group by scenario outcome
  const duplicates = results.filter((r) => r.isDuplicate);
  const uniqueUsers = new Set(results.filter((r) => r.success && !r.isDuplicate).map((r) => r.userId));

  console.log("Results Breakdown:");
  console.log(`  🔁 Duplicates detected: ${duplicates.length}`);
  console.log(`  👥 Unique users created/matched: ${uniqueUsers.size}`);
  console.log(`  📧 Emails sent: ${results.filter((r) => r.emailSent).length}`);

  // Average speed to lead
  const speeds = results
    .filter((r) => r.speedToLeadMs !== null && r.speedToLeadMs !== undefined)
    .map((r) => r.speedToLeadMs!);
  
  if (speeds.length > 0) {
    const avgSpeed = Math.round(speeds.reduce((a, b) => a + b, 0) / speeds.length);
    console.log(`  ⚡ Avg Speed to Lead: ${avgSpeed}ms`);
  }

  // User matching verification
  console.log("\n👤 User Matching Results:");
  const userGroups = new Map<string, string[]>();
  results
    .filter((r) => r.userId)
    .forEach((r) => {
      const leads = userGroups.get(r.userId!) || [];
      leads.push(r.name);
      userGroups.set(r.userId!, leads);
    });

  userGroups.forEach((leads, userId) => {
    console.log(`  ${userId.slice(0, 8)}... → ${leads.length} lead(s)`);
    leads.forEach((lead) => console.log(`     - ${lead}`));
  });

  console.log("\n");

  // Exit with error code if any tests failed
  process.exit(failed.length > 0 ? 1 : 0);
}

// Run the demo
runDemo().catch(console.error);
