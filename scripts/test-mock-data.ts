/**
 * Mock Data Test Script
 *
 * Creates 10 test leads:
 * - 1 faulty (missing required data)
 * - 2 duplicates (same correlation ID)
 * - 3 from the same person (same email/phone)
 * - 4 distinct leads
 *
 * Run with: npm run test:mock
 */

import {
  faultyLead,
  duplicateOriginalLead,
  duplicateCopyLead,
  samePersonLead1,
  samePersonLead2,
  samePersonLead3,
  sampleAngiLead,
  distinctLead2,
  distinctLead3,
  distinctLead4,
} from "../tests/mocks/data";

const API_URL = process.env.API_URL || "http://localhost:3000";

// ============================================
// Test Configuration
// ============================================

interface TestLead {
  name: string;
  description: string;
  expectedResult: "success" | "error" | "duplicate" | "same_user";
  payload: Record<string, unknown>;
}

const mockLeads: TestLead[] = [
  // 1. FAULTY - Missing required data
  {
    name: "Faulty Lead",
    description: "Missing Email and CorrelationId - should fail validation",
    expectedResult: "error",
    payload: faultyLead,
  },

  // 2-3. DUPLICATES - Same correlation ID
  {
    name: "Duplicate Lead #1 (Original)",
    description: "First lead with shared correlation ID",
    expectedResult: "success",
    payload: duplicateOriginalLead,
  },
  {
    name: "Duplicate Lead #2 (Should be flagged)",
    description: "Same correlation ID as #2 - should be flagged as duplicate",
    expectedResult: "duplicate",
    payload: duplicateCopyLead,
  },

  // 4-6. SAME PERSON - Same email/phone, different leads
  {
    name: "Same Person Lead #1",
    description: "First lead from Sarah Johnson",
    expectedResult: "success",
    payload: samePersonLead1,
  },
  {
    name: "Same Person Lead #2",
    description: "Second lead from Sarah Johnson (should match existing user)",
    expectedResult: "same_user",
    payload: samePersonLead2,
  },
  {
    name: "Same Person Lead #3",
    description: "Third lead from Sarah Johnson (should match existing user)",
    expectedResult: "same_user",
    payload: samePersonLead3,
  },

  // 7-10. DISTINCT LEADS - All different
  {
    name: "Distinct Lead #1 (Bob Builder)",
    description: "Bob Builder - House cleaning in Indianapolis",
    expectedResult: "success",
    payload: sampleAngiLead,
  },
  {
    name: "Distinct Lead #2 (Alice Smith)",
    description: "Alice Smith - Lawn care in Chicago",
    expectedResult: "success",
    payload: distinctLead2,
  },
  {
    name: "Distinct Lead #3 (Carlos Garcia)",
    description: "Carlos Garcia - HVAC repair in Houston",
    expectedResult: "success",
    payload: distinctLead3,
  },
  {
    name: "Distinct Lead #4 (Diana Lee)",
    description: "Diana Lee - Electrical work in Seattle",
    expectedResult: "success",
    payload: distinctLead4,
  },
];

// ============================================
// Test Runner
// ============================================

interface TestResult {
  name: string;
  description: string;
  expected: string;
  actual: string;
  passed: boolean;
  response: unknown;
  userId?: string;
}

async function runTests(): Promise<void> {
  console.log("\n🧪 MOCK DATA TEST SCRIPT");
  console.log("========================\n");
  console.log(`API URL: ${API_URL}/api/v1/lead/angi\n`);

  const results: TestResult[] = [];
  const userIds = new Map<string, string>(); // Track user IDs for same-person check

  for (let i = 0; i < mockLeads.length; i++) {
    const lead = mockLeads[i];
    console.log(`[${i + 1}/${mockLeads.length}] ${lead.name}`);
    console.log(`    ${lead.description}`);

    try {
      const response = await fetch(`${API_URL}/api/v1/lead/angi`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lead.payload),
      });

      const data = await response.json();

      let actual: string;
      let passed: boolean;

      if (!response.ok || !data.success) {
        actual = "error";
        passed = lead.expectedResult === "error";
      } else if (data.isDuplicate) {
        actual = "duplicate";
        passed = lead.expectedResult === "duplicate";
      } else {
        // Check if this is a same-user scenario
        const email = (lead.payload as { Email?: string }).Email;
        if (email && userIds.has(email)) {
          actual = data.userId === userIds.get(email) ? "same_user" : "success";
        } else {
          actual = "success";
          if (email) userIds.set(email, data.userId);
        }
        passed =
          lead.expectedResult === actual ||
          (lead.expectedResult === "same_user" && actual === "same_user") ||
          (lead.expectedResult === "success" && actual === "success");
      }

      const icon = passed ? "✅" : "❌";
      console.log(`    ${icon} Expected: ${lead.expectedResult}, Got: ${actual}`);

      if (data.speedToLeadMs !== undefined) {
        console.log(`    ⚡ Speed to lead: ${data.speedToLeadMs}ms`);
      }

      results.push({
        name: lead.name,
        description: lead.description,
        expected: lead.expectedResult,
        actual,
        passed,
        response: data,
        userId: data.userId,
      });
    } catch (error) {
      console.log(`    ❌ Error: ${error}`);
      results.push({
        name: lead.name,
        description: lead.description,
        expected: lead.expectedResult,
        actual: "error",
        passed: lead.expectedResult === "error",
        response: { error: String(error) },
      });
    }

    console.log("");
  }

  // ============================================
  // Summary
  // ============================================
  console.log("\n📊 TEST SUMMARY");
  console.log("===============\n");

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log(`Total:  ${results.length}`);
  console.log(`Passed: ${passed} ✅`);
  console.log(`Failed: ${failed} ❌`);

  // Group by result type
  const byType = {
    error: results.filter((r) => r.actual === "error"),
    duplicate: results.filter((r) => r.actual === "duplicate"),
    same_user: results.filter((r) => r.actual === "same_user"),
    success: results.filter((r) => r.actual === "success"),
  };

  console.log("\nBy Result Type:");
  console.log(`  - Errors (validation failures): ${byType.error.length}`);
  console.log(`  - Duplicates detected: ${byType.duplicate.length}`);
  console.log(`  - Same user matched: ${byType.same_user.length}`);
  console.log(`  - New leads created: ${byType.success.length}`);

  // Show failed tests
  if (failed > 0) {
    console.log("\n❌ FAILED TESTS:");
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(`  - ${r.name}: expected ${r.expected}, got ${r.actual}`);
      });
  }

  console.log("\n");

  // Exit with error code if tests failed
  process.exit(failed > 0 ? 1 : 0);
}

// Run the tests
runTests().catch(console.error);
