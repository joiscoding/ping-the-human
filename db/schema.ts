import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// Users table - customers who submit leads
export const users = sqliteTable("users", {
  id: text("id").primaryKey(), // UUID
  email: text("email").unique(),
  phone: text("phone").unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// Leads table - service requests from Angi
export const leads = sqliteTable("leads", {
  id: text("id").primaryKey(), // UUID
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  // Address
  addressLine1: text("address_line1"),
  addressLine2: text("address_line2"),
  city: text("city"),
  state: text("state"),
  postalCode: text("postal_code"),
  // Lead details
  source: text("source").notNull(), // e.g., "Angie's List Quote Request"
  description: text("description"),
  category: text("category"), // e.g., "Indianapolis – House Cleaning"
  urgency: text("urgency"), // e.g., "This Week"
  // Angi-specific fields
  correlationId: text("correlation_id").unique(), // Angi's unique ID for duplicate detection
  alAccountId: text("al_account_id"), // Angi account ID
  // Status and timestamps
  status: text("status").notNull().default("pending"), // pending, processed, duplicate
  converted: integer("converted", { mode: "boolean" }).default(false),
  // Speed-to-lead tracking
  receivedAt: integer("received_at", { mode: "timestamp" }).notNull(),
  processedAt: integer("processed_at", { mode: "timestamp" }),
});

// Messages table - email and SMS threads for each lead
export const messages = sqliteTable("messages", {
  id: text("id").primaryKey(), // UUID
  leadId: text("lead_id")
    .notNull()
    .references(() => leads.id),
  // Message details
  channel: text("channel").notNull(), // 'email' | 'sms'
  direction: text("direction").notNull(), // 'inbound' | 'outbound'
  fromAddress: text("from_address").notNull(),
  toAddress: text("to_address").notNull(),
  subject: text("subject"), // nullable - for emails only
  body: text("body").notNull(),
  htmlBody: text("html_body"), // HTML version of the body for rich email content
  // Status tracking
  status: text("status").notNull().default("draft"), // draft, sent, delivered, failed, received
  externalId: text("external_id"), // Provider tracking ID for future integration
  // Timestamps
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  sentAt: integer("sent_at", { mode: "timestamp" }),
  deliveredAt: integer("delivered_at", { mode: "timestamp" }),
  readAt: integer("read_at", { mode: "timestamp" }),
});

// Duplicate leads table - for rebate tracking
export const duplicateLeads = sqliteTable("duplicate_leads", {
  id: text("id").primaryKey(), // UUID
  originalLeadId: text("original_lead_id")
    .notNull()
    .references(() => leads.id),
  duplicateLeadId: text("duplicate_lead_id")
    .notNull()
    .references(() => leads.id),
  matchCriteria: text("match_criteria").notNull(), // e.g., "correlation_id"
  detectedAt: integer("detected_at", { mode: "timestamp" }).notNull(),
  rebateClaimed: integer("rebate_claimed", { mode: "boolean" }).default(false),
  rebateStatus: text("rebate_status"), // pending, submitted, approved, rejected
});

// Type exports for use in application
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;

export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;

export type DuplicateLead = typeof duplicateLeads.$inferSelect;
export type NewDuplicateLead = typeof duplicateLeads.$inferInsert;
