import { NextRequest, NextResponse } from "next/server";
import { getMessage, getMessageThread } from "@/lib/messaging";
import { db } from "@/db";
import { leads, users } from "@/db/schema";
import { UUIDParamSchema } from "@/lib/schemas";
import { eq } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/v1/message/[id]
 *
 * Get a single message by ID with associated lead and user info.
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

    // Get associated lead and user
    const lead = await db
      .select()
      .from(leads)
      .where(eq(leads.id, message.leadId))
      .get();

    let user = null;
    if (lead) {
      user = await db
        .select()
        .from(users)
        .where(eq(users.id, lead.userId))
        .get();
    }

    // Get all messages in the thread
    const thread = await getMessageThread(message.leadId);

    return NextResponse.json({
      success: true,
      message,
      lead,
      user,
      thread,
      threadCount: thread.length,
    });
  } catch (error: unknown) {
    console.error("[Get Message Error]", error instanceof Error ? error.message : error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
