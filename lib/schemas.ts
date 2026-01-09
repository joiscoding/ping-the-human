import { z } from "zod";

// =============================================================================
// Angi Webhook Payload Schema
// =============================================================================

export const AngiPostalAddressSchema = z.object({
  AddressFirstLine: z.string(),
  AddressSecondLine: z.string().optional().default(""),
  City: z.string(),
  State: z.string(),
  PostalCode: z.string(),
});

export const AngiLeadSchema = z.object({
  FirstName: z.string(),
  LastName: z.string(),
  PhoneNumber: z.string(),
  PostalAddress: AngiPostalAddressSchema,
  Email: z.string().email(),
  Source: z.string(),
  Description: z.string(),
  Category: z.string(),
  Urgency: z.string(),
  CorrelationId: z.string().uuid(),
  ALAccountId: z.string(),
});

export type AngiLead = z.infer<typeof AngiLeadSchema>;

// =============================================================================
// Query Parameter Schemas for API Routes
// =============================================================================

export const LeadQuerySchema = z.object({
  status: z.enum(["pending", "processed", "duplicate"]).optional(),
  source: z.string().optional(),
  userId: z.string().uuid().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

export type LeadQuery = z.infer<typeof LeadQuerySchema>;

// =============================================================================
// Database Insert Schemas (for validation before insert)
// =============================================================================

export const InsertUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email().nullable(),
  phone: z.string().nullable(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const InsertLeadSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  addressLine1: z.string().nullable(),
  addressLine2: z.string().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  postalCode: z.string().nullable(),
  source: z.string(),
  description: z.string().nullable(),
  category: z.string().nullable(),
  urgency: z.string().nullable(),
  correlationId: z.string().uuid().nullable(),
  alAccountId: z.string().nullable(),
  status: z.enum(["pending", "processed", "duplicate"]).default("pending"),
  converted: z.boolean().default(false),
  receivedAt: z.date(),
  processedAt: z.date().nullable(),
});

export const InsertMessageSchema = z.object({
  id: z.string().uuid(),
  leadId: z.string().uuid(),
  channel: z.enum(["email", "sms"]),
  direction: z.enum(["inbound", "outbound"]),
  fromAddress: z.string(),
  toAddress: z.string(),
  subject: z.string().nullable(),
  body: z.string(),
  status: z
    .enum(["draft", "sent", "delivered", "failed", "received"])
    .default("draft"),
  externalId: z.string().nullable(),
  createdAt: z.date(),
  sentAt: z.date().nullable(),
  deliveredAt: z.date().nullable(),
  readAt: z.date().nullable(),
});

// =============================================================================
// API Response Schemas
// =============================================================================

export const LeadResponseSchema = z.object({
  success: z.boolean(),
  leadId: z.string().uuid(),
  userId: z.string().uuid(),
  isDuplicate: z.boolean(),
  speedToLeadMs: z.number().nullable(),
  messageId: z.string().uuid().optional(),
  emailSent: z.boolean().optional(),
});

export type LeadResponse = z.infer<typeof LeadResponseSchema>;
