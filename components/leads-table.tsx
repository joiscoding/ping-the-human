"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";

interface LeadWithUser {
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
  user: {
    id: string;
    email: string | null;
    phone: string | null;
    firstName: string | null;
    lastName: string | null;
  } | null;
  speedToLeadMs: number | null;
  messageCount: number;
  hasResponse: boolean;
}

interface LeadsResponse {
  success: boolean;
  data: LeadWithUser[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatSpeedToLead(ms: number | null): string {
  if (ms === null) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function getCustomerName(user: LeadWithUser["user"]): string {
  if (!user) return "Unknown";
  if (user.firstName || user.lastName) {
    return [user.firstName, user.lastName].filter(Boolean).join(" ");
  }
  return user.email || "Unknown";
}

export function LeadsTable() {
  const router = useRouter();
  const [leads, setLeads] = useState<LeadWithUser[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 50,
    offset: 0,
    hasMore: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set("limit", String(pagination.limit));
      params.set("offset", String(pagination.offset));

      const response = await fetch(`/api/v1/lead?${params.toString()}`);
      const data: LeadsResponse = await response.json();

      if (data.success) {
        setLeads(data.data);
        setPagination(data.pagination);
      } else {
        setError("Failed to fetch leads");
      }
    } catch {
      setError("Failed to fetch leads");
    } finally {
      setLoading(false);
    }
  }, [pagination.limit, pagination.offset]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleRowClick = (leadId: string) => {
    router.push(`/leads/${leadId}`);
  };

  const handlePreviousPage = () => {
    setPagination((prev) => ({
      ...prev,
      offset: Math.max(0, prev.offset - prev.limit),
    }));
  };

  const handleNextPage = () => {
    if (pagination.hasMore) {
      setPagination((prev) => ({
        ...prev,
        offset: prev.offset + prev.limit,
      }));
    }
  };

  const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;
  const totalPages = Math.ceil(pagination.total / pagination.limit);
  const showingStart = pagination.total > 0 ? pagination.offset + 1 : 0;
  const showingEnd = Math.min(pagination.offset + pagination.limit, pagination.total);

  return (
    <Card className="overflow-hidden">
      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
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
            <span>Loading leads...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <button
              onClick={fetchLeads}
              className="mt-2 text-sm text-blue-600 hover:underline dark:text-blue-400"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && leads.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <p className="text-zinc-500 dark:text-zinc-400">No leads found</p>
        </div>
      )}

      {/* Table */}
      {!loading && !error && leads.length > 0 && (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Received</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Speed</TableHead>
                <TableHead className="text-center">Msgs</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead) => (
                <TableRow
                  key={lead.id}
                  clickable
                  onClick={() => handleRowClick(lead.id)}
                >
                  <TableCell className="whitespace-nowrap">
                    {formatDate(lead.receivedAt)}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{getCustomerName(lead.user)}</div>
                    {lead.user?.email && (
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        {lead.user.email}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div>{lead.category || "—"}</div>
                    {lead.city && (
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        {lead.city}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {lead.state || "—"}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {formatSpeedToLead(lead.speedToLeadMs)}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center gap-1">
                      {lead.messageCount}
                      {lead.hasResponse && (
                        <span
                          className="h-2 w-2 rounded-full bg-green-500"
                          title="Has customer response"
                        />
                      )}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-zinc-200 bg-zinc-50/50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/50">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Showing {showingStart}–{showingEnd} of {pagination.total}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePreviousPage}
                disabled={pagination.offset === 0}
                className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                Previous
              </button>
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                Page {currentPage} of {totalPages || 1}
              </span>
              <button
                onClick={handleNextPage}
                disabled={!pagination.hasMore}
                className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
