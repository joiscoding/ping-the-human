import { Resend } from "resend";

// Initialize Resend client
// Get your API key from https://resend.com/api-keys
const resend = new Resend(process.env.RESEND_API_KEY);

// Default from email - use your verified domain or Resend's test domain
const DEFAULT_FROM_EMAIL =
  process.env.FROM_EMAIL || "onboarding@resend.dev";

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  body: string;
  from?: string;
  replyTo?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send an email using Resend.
 *
 * To use your own email:
 * 1. Sign up at https://resend.com
 * 2. Add and verify your domain (or use their test domain for development)
 * 3. Create an API key and set RESEND_API_KEY in your .env
 * 4. Set FROM_EMAIL to your verified sender address
 *
 * @param options - Email options (to, subject, body, etc.)
 * @returns Result with success status and message ID or error
 */
export async function sendEmail(
  options: SendEmailOptions
): Promise<SendEmailResult> {
  const { to, subject, body, from = DEFAULT_FROM_EMAIL, replyTo } = options;

  // Check if API key is configured
  if (!process.env.RESEND_API_KEY) {
    console.warn(
      "[Email] RESEND_API_KEY not configured. Email will not be sent."
    );
    return {
      success: false,
      error: "Email service not configured. Set RESEND_API_KEY in environment.",
    };
  }

  try {
    const { data, error } = await resend.emails.send({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      text: body,
      replyTo,
    });

    if (error) {
      console.error("[Email] Send failed:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    console.log(`[Email] Sent successfully. ID: ${data?.id}`);
    return {
      success: true,
      messageId: data?.id,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("[Email] Exception:", errorMessage);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Send a test email to verify configuration.
 *
 * @param toEmail - Email address to send test to
 * @returns Result with success status
 */
export async function sendTestEmail(toEmail: string): Promise<SendEmailResult> {
  return sendEmail({
    to: toEmail,
    subject: "Netic - Email Configuration Test",
    body: `Hello!

This is a test email from Netic Lead Management System.

If you received this, your email configuration is working correctly.

- Netic`,
  });
}
