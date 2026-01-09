import type { AngiLead } from "@/lib/schemas";

// ============================================
// Shared values for test scenarios
// ============================================

/** Shared correlation ID for duplicate lead tests (valid UUID v4) */
export const DUPLICATE_CORRELATION_ID = "550e8400-e29b-41d4-a716-446655440001";

/** Shared person details for same-person tests */
export const SAME_PERSON = {
  FirstName: "Sarah",
  LastName: "Johnson",
  PhoneNumber: "5551234567",
  Email: "sarah.johnson@example.com",
};

// ============================================
// 1. FAULTY LEAD - Missing required data
// ============================================

/** Lead missing Email and CorrelationId - should fail validation */
export const faultyLead = {
  FirstName: "Broken",
  LastName: "Lead",
  PhoneNumber: "5559999999",
  PostalAddress: {
    AddressFirstLine: "404 Error St.",
    City: "Nowhere",
    State: "XX",
    PostalCode: "00000",
  },
  Source: "Test",
  Description: "This should fail",
  Category: "Test Category",
  Urgency: "Never",
  // Missing: Email, CorrelationId, ALAccountId
};

// ============================================
// 2-3. DUPLICATE LEADS - Same correlation ID
// ============================================

/** First lead with shared correlation ID */
export const duplicateOriginalLead: AngiLead = {
  FirstName: "Mike",
  LastName: "Williams",
  PhoneNumber: "5552222222",
  PostalAddress: {
    AddressFirstLine: "222 Duplicate Dr.",
    AddressSecondLine: "",
    City: "Chicago",
    State: "IL",
    PostalCode: "60601",
  },
  Email: "mike.williams@example.com",
  Source: "Angie's List Quote Request",
  Description: "First request - plumbing repair needed",
  Category: "Chicago – Plumbing",
  Urgency: "Today",
  CorrelationId: DUPLICATE_CORRELATION_ID,
  ALAccountId: "DUP001",
};

/** Same correlation ID as above - should be flagged as duplicate */
export const duplicateCopyLead: AngiLead = {
  ...duplicateOriginalLead,
  Description: "Second request - same issue, duplicate submission",
};

// ============================================
// 4-6. SAME PERSON LEADS - Same email/phone
// ============================================

/** First lead from Sarah Johnson */
export const samePersonLead1: AngiLead = {
  ...SAME_PERSON,
  PostalAddress: {
    AddressFirstLine: "100 Main St.",
    AddressSecondLine: "Apt 1A",
    City: "Indianapolis",
    State: "IN",
    PostalCode: "46201",
  },
  Source: "Angie's List Quote Request",
  Description: "Need house cleaning service weekly",
  Category: "Indianapolis – House Cleaning",
  Urgency: "This Week",
  CorrelationId: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
  ALAccountId: "SARAH001",
};

/** Second lead from Sarah Johnson (should match existing user) */
export const samePersonLead2: AngiLead = {
  ...SAME_PERSON,
  PostalAddress: {
    AddressFirstLine: "100 Main St.",
    AddressSecondLine: "Apt 1A",
    City: "Indianapolis",
    State: "IN",
    PostalCode: "46201",
  },
  Source: "Angie's List Quote Request",
  Description: "Also need lawn care service",
  Category: "Indianapolis – Lawn Care",
  Urgency: "Within 2 Weeks",
  CorrelationId: "6ba7b811-9dad-11d1-80b4-00c04fd430c8",
  ALAccountId: "SARAH002",
};

/** Third lead from Sarah Johnson (should match existing user) */
export const samePersonLead3: AngiLead = {
  ...SAME_PERSON,
  PostalAddress: {
    AddressFirstLine: "100 Main St.",
    AddressSecondLine: "Apt 1A",
    City: "Indianapolis",
    State: "IN",
    PostalCode: "46201",
  },
  Source: "Angie's List Quote Request",
  Description: "Looking for painting services",
  Category: "Indianapolis – Interior Painting",
  Urgency: "Flexible",
  CorrelationId: "6ba7b812-9dad-11d1-80b4-00c04fd430c8",
  ALAccountId: "SARAH003",
};

// ============================================
// 7-10. DISTINCT LEADS - All different
// ============================================

/** Bob Builder - House cleaning in Indianapolis */
export const sampleAngiLead: AngiLead = {
  FirstName: "Bob",
  LastName: "Builder",
  PhoneNumber: "5554332646",
  PostalAddress: {
    AddressFirstLine: "123 Main St.",
    AddressSecondLine: "",
    City: "Indianapolis",
    State: "IN",
    PostalCode: "46203",
  },
  Email: "bob.builder@gmail.com",
  Source: "Angie's List Quote Request",
  Description: "I'm Looking for recurring house cleaning services please.",
  Category: "Indianapolis – House Cleaning",
  Urgency: "This Week",
  CorrelationId: "61a7de56-dba3-4e59-8e2a-3fa827f84f7f",
  ALAccountId: "123456",
};

/** Alice Smith - Lawn care in Chicago */
export const distinctLead2: AngiLead = {
  FirstName: "Alice",
  LastName: "Smith",
  PhoneNumber: "5559876543",
  PostalAddress: {
    AddressFirstLine: "456 Oak Ave.",
    AddressSecondLine: "Suite 200",
    City: "Chicago",
    State: "IL",
    PostalCode: "60602",
  },
  Email: "alice.smith@example.com",
  Source: "Angie's List Quote Request",
  Description: "Need help with lawn care and landscaping",
  Category: "Chicago – Lawn Care",
  Urgency: "Within 2 Weeks",
  CorrelationId: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  ALAccountId: "789012",
};

/** Carlos Garcia - HVAC repair in Houston */
export const distinctLead3: AngiLead = {
  FirstName: "Carlos",
  LastName: "Garcia",
  PhoneNumber: "5557654321",
  PostalAddress: {
    AddressFirstLine: "789 Pine Rd.",
    AddressSecondLine: "",
    City: "Houston",
    State: "TX",
    PostalCode: "77001",
  },
  Email: "carlos.garcia@example.com",
  Source: "Angie's List Quote Request",
  Description: "AC unit not cooling properly, need repair",
  Category: "Houston – HVAC Repair",
  Urgency: "Today",
  CorrelationId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  ALAccountId: "345678",
};

/** Diana Lee - Electrical work in Seattle */
export const distinctLead4: AngiLead = {
  FirstName: "Diana",
  LastName: "Lee",
  PhoneNumber: "5558765432",
  PostalAddress: {
    AddressFirstLine: "321 Cedar Lane",
    AddressSecondLine: "Unit B",
    City: "Seattle",
    State: "WA",
    PostalCode: "98101",
  },
  Email: "diana.lee@example.com",
  Source: "Angie's List Quote Request",
  Description: "Need electrical panel upgrade for home",
  Category: "Seattle – Electrical",
  Urgency: "This Week",
  CorrelationId: "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
  ALAccountId: "901234",
};

// ============================================
// Grouped exports for test suites
// ============================================

/** All mock leads grouped by test scenario */
export const mockLeadSets = {
  faulty: [faultyLead],
  duplicates: [duplicateOriginalLead, duplicateCopyLead],
  samePerson: [samePersonLead1, samePersonLead2, samePersonLead3],
  distinct: [sampleAngiLead, distinctLead2, distinctLead3, distinctLead4],
};

/** All valid leads (excludes faulty) */
export const allValidLeads: AngiLead[] = [
  duplicateOriginalLead,
  duplicateCopyLead,
  samePersonLead1,
  samePersonLead2,
  samePersonLead3,
  sampleAngiLead,
  distinctLead2,
  distinctLead3,
  distinctLead4,
];

/** All leads including faulty */
export const allLeads = [faultyLead, ...allValidLeads];
