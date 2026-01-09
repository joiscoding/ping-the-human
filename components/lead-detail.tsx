"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, getStatusVariant } from "@/components/ui/badge";
import { MessageList } from "@/components/message-list";
import { CustomerPanel } from "@/components/customer-panel";

interface Lead {
  id: string;
  userId: string;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  source: string;
  description: string | null;
  category: string | null;
  urgency: string | null;
  correlationId: string | null;
  alAccountId: string | null;
  status: string;
  converted: boolean | null;
  receivedAt: string;
  processedAt: string | null;
  speedToLeadMs: number | null;
  messageCount: number;
  inboundCount: number;
  outboundCount: number;
  hasResponse: boolean;
}

interface User {
  id: string;
  email: string | null;
  phone: string | null;
  firstName: string | null;
  lastName: string | null;
  createdAt: string;
}

interface Message {
  id: string;
  leadId: string;
  channel: string;
  direction: string;
  fromAddress: string;
  toAddress: string;
  subject: string | null;
  body: string;
  htmlBody: string | null;
  status: string;
  externalId: string | null;
  createdAt: string;
  sentAt: string | null;
  deliveredAt: string | null;
  readAt: string | null;
}

interface OtherLead {
  id: string;
  category: string | null;
  status: string;
  receivedAt: string;
  description: string | null;
}

interface LeadDetailResponse {
  success: boolean;
  data: {
    lead: Lead;
    user: User | null;
    messages: Message[];
    otherLeads: OtherLead[];
  };
  error?: string;
}

interface LeadDetailProps {
  leadId: string;
}

function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatSpeedToLead(ms: number | null): string {
  if (ms === null) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatAddress(lead: Lead): string {
  const parts = [
    lead.addressLine1,
    lead.addressLine2,
    [lead.city, lead.state].filter(Boolean).join(", "),
    lead.postalCode,
  ].filter(Boolean);
  return parts.join(", ") || "No address";
}

export function LeadDetail({ leadId }: LeadDetailProps) {
  const [data, setData] = useState<LeadDetailResponse["data"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLead() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/v1/lead/${leadId}`);
        const result: LeadDetailResponse = await response.json();

        if (result.success) {
          setData(result.data);
        } else {
          setError(result.error || "Failed to fetch lead");
        }
      } catch {
        setError("Failed to fetch lead");
      } finally {
        setLoading(false);
      }
    }

    fetchLead();
  }, [leadId]);

  // Loading State
  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-3 text-zinc-500 dark:text-zinc-400">
          <svg
            className="h-5 w-5 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span>Loading lead...</span>
        </div>
      </div>
    );
  }

  // Error State
  if (error || !data) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">{error || "Lead not found"}</p>
          <Link
            href="/"
            className="mt-2 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            Back to leads
          </Link>
        </div>
      </div>
    );
  }

  const { lead, user, messages, otherLeads } = data;

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to Leads
      </Link>

      {/* Lead Header */}
      <Card>
        <CardContent className="py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                  {lead.category || "Lead Request"}
                </h1>
                <Badge variant={getStatusVariant(lead.status)}>{lead.status}</Badge>
              </div>

              {lead.description && (
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  {lead.description}
                </p>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-500 dark:text-zinc-400">
                <span>Received: {formatDateTime(lead.receivedAt)}</span>
                <span>•</span>
                <span>Speed-to-lead: {formatSpeedToLead(lead.speedToLeadMs)}</span>
                {lead.urgency && (
                  <>
                    <span>•</span>
                    <span>Urgency: {lead.urgency}</span>
                  </>
                )}
              </div>

              <div className="mt-2 flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span>{formatAddress(lead)}</span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-4 sm:flex-col sm:items-end">
              <div className="text-center sm:text-right">
                <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                  {lead.messageCount}
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  Messages
                </div>
              </div>
              {lead.hasResponse && (
                <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  Has Response
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Messages Panel */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Messages ({messages.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <MessageList messages={messages} />
            </CardContent>
          </Card>
        </div>

        {/* Customer Panel */}
        <div>
          <CustomerPanel user={user} otherLeads={otherLeads} />
        </div>
      </div>
    </div>
  );
}
