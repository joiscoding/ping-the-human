import { db } from "@/db";
import { messages, type Message, type Lead, type User } from "@/db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { sendEmail } from "./email";

const FROM_EMAIL = process.env.FROM_EMAIL || "onboarding@resend.dev";
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
  const category = (lead.category || "your request").toLowerCase();
  const city = lead.city || "your area";
  const bookingLink = `${BOOKING_URL}?leadId=${lead.id}`;

  const body = `Hello ${firstName},

We can help with ${category}. And, we are available today to head over to ${city}.

Please book here: ${bookingLink}

Netic`;

  const html = `<p>Hello ${firstName},</p>
<p>We can help with ${category}. And, we are available today to head over to ${city}.</p>
<p>Please book <a href="${bookingLink}">here</a></p>
<p>Netic</p>`;

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
    htmlBody: html,
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
    htmlBody: null,
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

/**
 * Get a single message by ID.
 *
 * @param messageId - The message ID
 * @returns The message or null if not found
 */
export async function getMessage(messageId: string): Promise<Message | null> {
  const message = await db
    .select()
    .from(messages)
    .where(eq(messages.id, messageId))
    .get();

  return message || null;
}

export interface SendMessageResult {
  success: boolean;
  message?: Message;
  error?: string;
}

/**
 * Send a draft message via email.
 * Updates the message status to 'sent' or 'failed' based on result.
 *
 * @param messageId - The ID of the message to send
 * @returns Result with success status and updated message
 */
export async function sendMessage(messageId: string): Promise<SendMessageResult> {
  // Get the message
  const message = await getMessage(messageId);

  if (!message) {
    return {
      success: false,
      error: "Message not found",
    };
  }

  // Check if message is in draft status
  if (message.status !== "draft") {
    return {
      success: false,
      error: `Message is not a draft (current status: ${message.status})`,
    };
  }

  // Check if it's an email (we only support email sending for now)
  if (message.channel !== "email") {
    return {
      success: false,
      error: `Channel '${message.channel}' not supported for sending. Only 'email' is supported.`,
    };
  }

  // Send the email
  const emailResult = await sendEmail({
    to: message.toAddress,
    subject: message.subject || "(No Subject)",
    body: message.body,
    html: message.htmlBody || undefined,
    from: message.fromAddress,
  });

  if (emailResult.success) {
    // Update message status to sent
    await updateMessageStatus(messageId, "sent", emailResult.messageId);

    // Get updated message
    const updatedMessage = await getMessage(messageId);

    console.log(
      `[Messaging] Email sent successfully. Message ID: ${messageId}, Email ID: ${emailResult.messageId}`
    );

    return {
      success: true,
      message: updatedMessage || undefined,
    };
  } else {
    // Update message status to failed
    await updateMessageStatus(messageId, "failed");

    console.error(
      `[Messaging] Failed to send email. Message ID: ${messageId}, Error: ${emailResult.error}`
    );

    return {
      success: false,
      error: emailResult.error,
    };
  }
}

/**
 * Draft and immediately send an intro message.
 * Combines draftIntroMessage and sendMessage for immediate sending.
 *
 * @param lead - The lead to send the intro email to
 * @param user - The user associated with the lead
 * @returns Result with success status and message
 */
export async function sendIntroMessage(
  lead: Lead,
  user: User
): Promise<SendMessageResult> {
  // First draft the message
  const message = await draftIntroMessage(lead, user);

  // Then send it
  return sendMessage(message.id);
}
