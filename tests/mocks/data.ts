import type { AngiLead } from "@/lib/schemas";

/**
 * Sample Angi lead payload for testing
 */
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

/**
 * Another sample lead for duplicate testing
 */
export const duplicateAngiLead: AngiLead = {
  ...sampleAngiLead,
  // Same CorrelationId = duplicate
};

/**
 * Different lead (different correlation ID)
 */
export const differentAngiLead: AngiLead = {
  FirstName: "Alice",
  LastName: "Smith",
  PhoneNumber: "5559876543",
  PostalAddress: {
    AddressFirstLine: "456 Oak Ave.",
    AddressSecondLine: "Apt 2B",
    City: "Chicago",
    State: "IL",
    PostalCode: "60601",
  },
  Email: "alice.smith@example.com",
  Source: "Angie's List Quote Request",
  Description: "Need help with lawn care and landscaping.",
  Category: "Chicago – Lawn Care",
  Urgency: "Within 2 Weeks",
  CorrelationId: "72b8ef67-eca4-5f6a-9f3b-4gb938g95g8g",
  ALAccountId: "789012",
};

/**
 * Lead with same email but different phone (for user matching tests)
 */
export const sameEmailLead: AngiLead = {
  ...sampleAngiLead,
  PhoneNumber: "5551111111",
  CorrelationId: "83c9fg78-fdb5-6g7b-0g4c-5hc049h06h9h",
};

/**
 * Lead with same phone but different email (for user matching tests)
 */
export const samePhoneLead: AngiLead = {
  ...sampleAngiLead,
  Email: "different.email@example.com",
  CorrelationId: "94d0gh89-gec6-7h8c-1h5d-6id150i17i0i",
};
