/**
 * E2E Test: Create a lead and send an email
 *
 * This script:
 * 1. Posts a lead to /api/v1/lead/angi with your email
 * 2. Sends the draft message via /api/v1/message/{id}/send
 * 3. You can verify the email arrives in your inbox
 *
 * Usage: npx tsx scripts/test-email-e2e.ts
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const TEST_EMAIL = "josephyanginfo@gmail.com";

// Generate a unique correlation ID for this test
const correlationId = crypto.randomUUID();

const testLead = {
  FirstName: "Joseph",
  LastName: "Yang",
  PhoneNumber: `555${Date.now().toString().slice(-7)}`, // Unique phone to create new user
  PostalAddress: {
    AddressFirstLine: "123 Test Street",
    AddressSecondLine: "Apt 4",
    City: "San Francisco",
    State: "CA",
    PostalCode: "94102",
  },
  Email: TEST_EMAIL,
  Source: "E2E Test",
  Description: "Testing email sending functionality end-to-end",
  Category: "House Cleaning",
  Urgency: "This Week",
  CorrelationId: correlationId,
  ALAccountId: "test-123",
};

async function main() {
  console.log("🚀 Starting E2E Email Test");
  console.log(`📧 Test email will be sent to: ${TEST_EMAIL}`);
  console.log(`🔗 Base URL: ${BASE_URL}`);
  console.log(`🆔 Correlation ID: ${correlationId}`);
  console.log("");

  // Step 1: Create the lead
  console.log("Step 1: Creating lead via POST /api/v1/lead/angi...");
  
  let leadResponse;
  try {
    const res = await fetch(`${BASE_URL}/api/v1/lead/angi`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testLead),
    });

    leadResponse = await res.json();

    if (!res.ok) {
      console.error("❌ Failed to create lead:", leadResponse);
      process.exit(1);
    }

    console.log("✅ Lead created successfully!");
    console.log(`   Lead ID: ${leadResponse.leadId}`);
    console.log(`   User ID: ${leadResponse.userId}`);
    console.log(`   Message ID: ${leadResponse.messageId}`);
    console.log(`   Speed to Lead: ${leadResponse.speedToLeadMs}ms`);
    console.log("");
  } catch (error) {
    console.error("❌ Error creating lead:", error);
    console.error("   Make sure the dev server is running: npm run dev");
    process.exit(1);
  }

  // Step 2: Send the draft message
  if (!leadResponse.messageId) {
    console.error("❌ No message ID returned. Cannot send email.");
    process.exit(1);
  }

  console.log(`Step 2: Sending email via POST /api/v1/message/${leadResponse.messageId}/send...`);

  try {
    const res = await fetch(
      `${BASE_URL}/api/v1/message/${leadResponse.messageId}/send`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const sendResponse = await res.json();

    if (!res.ok) {
      console.error("❌ Failed to send email:", sendResponse);
      if (sendResponse.error?.includes("not configured")) {
        console.error("");
        console.error("💡 Tip: Make sure RESEND_API_KEY is set in your .env.local");
      }
      process.exit(1);
    }

    console.log("✅ Email sent successfully!");
    console.log(`   Status: ${sendResponse.status}`);
    console.log(`   External ID: ${sendResponse.message?.externalId || "N/A"}`);
    console.log("");
  } catch (error) {
    console.error("❌ Error sending email:", error);
    process.exit(1);
  }

  // Success!
  console.log("🎉 E2E Test Complete!");
  console.log("");
  console.log(`📬 Check your inbox at: ${TEST_EMAIL}`);
  console.log("   The email should arrive within a few seconds.");
  console.log("");
  console.log("   Subject: Re: House Cleaning");
  console.log("   From: onboarding@resend.dev (or your configured FROM_EMAIL)");
}

main().catch(console.error);
