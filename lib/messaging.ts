import { db } from "@/db";
import { messages, type Message, type Lead, type User } from "@/db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";

const FROM_EMAIL = process.env.FROM_EMAIL || "netic@example.com";
const BOOKING_URL = process.env.BOOKING_URL || "http://localhost:3000/book";

/**
 * Draft the initial intro email for a new lead.
 * This creates the first outbound message in the conversation thread.
 *
 * @param lead - The lead to send the intro email to
 * @param user - The user associated with the lead
 * @returns The created message record
 */
export async function draftIntroMessage(
  lead: Lead,
  user: User
): Promise<Message> {
  const firstName = user.firstName || "there";
  const category = lead.category || "your request";

  const body = `Hello ${firstName},

We can help with ${category}. And, we are available today.

Please book here: ${BOOKING_URL}?leadId=${lead.id}

Netic`;

  const now = new Date();
  const message: Message = {
    id: uuid(),
    leadId: lead.id,
    channel: "email",
    direction: "outbound",
    fromAddress: FROM_EMAIL,
    toAddress: user.email || "",
    subject: `Re: ${category}`,
    body,
    status: "draft",
    externalId: null,
    createdAt: now,
    sentAt: null,
    deliveredAt: null,
    readAt: null,
  };

  await db.insert(messages).values(message);

  // Log the draft for demo purposes (simulating email send)
  console.log("=== EMAIL DRAFT CREATED ===");
  console.log(`To: ${message.toAddress}`);
  console.log(`Subject: ${message.subject}`);
  console.log(`Body:\n${message.body}`);
  console.log("===========================");

  return message;
}

/**
 * Get all messages for a lead (the conversation thread).
 *
 * @param leadId - The lead ID
 * @returns All messages ordered by creation time
 */
export async function getMessageThread(leadId: string): Promise<Message[]> {
  const thread = await db
    .select()
    .from(messages)
    .where(eq(messages.leadId, leadId))
    .orderBy(messages.createdAt)
    .all();

  return thread;
}

/**
 * Record an inbound message (customer reply).
 *
 * @param leadId - The lead ID
 * @param channel - 'email' or 'sms'
 * @param fromAddress - The customer's email or phone
 * @param body - The message content
 * @param subject - Optional subject for emails
 * @returns The created message record
 */
export async function recordInboundMessage(
  leadId: string,
  channel: "email" | "sms",
  fromAddress: string,
  body: string,
  subject?: string
): Promise<Message> {
  const now = new Date();
  const message: Message = {
    id: uuid(),
    leadId,
    channel,
    direction: "inbound",
    fromAddress,
    toAddress: FROM_EMAIL,
    subject: subject || null,
    body,
    status: "received",
    externalId: null,
    createdAt: now,
    sentAt: null,
    deliveredAt: null,
    readAt: null,
  };

  await db.insert(messages).values(message);

  return message;
}

/**
 * Update message status (e.g., when sent via email provider).
 *
 * @param messageId - The message ID
 * @param status - New status
 * @param externalId - Optional external provider ID
 */
export async function updateMessageStatus(
  messageId: string,
  status: "sent" | "delivered" | "failed",
  externalId?: string
): Promise<void> {
  const updates: Partial<Message> = { status };

  if (status === "sent") {
    updates.sentAt = new Date();
  } else if (status === "delivered") {
    updates.deliveredAt = new Date();
  }

  if (externalId) {
    updates.externalId = externalId;
  }

  await db.update(messages).set(updates).where(eq(messages.id, messageId));
}
