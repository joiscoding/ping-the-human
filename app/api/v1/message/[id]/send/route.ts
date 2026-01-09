import { NextRequest, NextResponse } from "next/server";
import { sendMessage, getMessage } from "@/lib/messaging";
import { UUIDParamSchema } from "@/lib/schemas";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/v1/message/[id]/send
 *
 * Send a draft message via email.
 *
 * Response:
 * - 200: Message sent successfully
 * - 400: Message is not a draft or channel not supported
 * - 404: Message not found
 * - 500: Email sending failed
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Validate UUID format
    const parseResult = UUIDParamSchema.safeParse(id);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid message ID format",
        },
        { status: 400 }
      );
    }

    // First check if message exists
    const message = await getMessage(id);

    if (!message) {
      return NextResponse.json(
        {
          success: false,
          error: "Message not found",
        },
        { status: 404 }
      );
    }

    // Send the message
    const result = await sendMessage(id);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        status: "sent",
      });
    } else {
      // Determine appropriate status code based on error
      const statusCode =
        result.error?.includes("not a draft") ||
        result.error?.includes("not supported")
          ? 400
          : 500;

      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: statusCode }
      );
    }
  } catch (error: unknown) {
    console.error("[Send Message Error]", error instanceof Error ? error.message : error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/message/[id]/send
 *
 * Get the send status of a message (useful for checking if message was already sent).
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Validate UUID format
    const parseResult = UUIDParamSchema.safeParse(id);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid message ID format",
        },
        { status: 400 }
      );
    }

    const message = await getMessage(id);

    if (!message) {
      return NextResponse.json(
        {
          success: false,
          error: "Message not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: {
        id: message.id,
        status: message.status,
        sentAt: message.sentAt,
        deliveredAt: message.deliveredAt,
        externalId: message.externalId,
      },
    });
  } catch (error: unknown) {
    console.error("[Get Message Status Error]", error instanceof Error ? error.message : error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
