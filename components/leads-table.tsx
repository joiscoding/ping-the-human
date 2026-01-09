"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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

type SortField = "receivedAt" | "customer" | "category" | "state" | "speedToLeadMs" | "messageCount";
type SortOrder = "asc" | "desc";

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

function getCategoryName(category: string | null): string {
  if (!category) return "—";
  // Category format is "City – Service Type", extract just the service type
  const parts = category.split(" – ");
  return parts.length > 1 ? parts[1] : category;
}

function SortIcon({ field, currentField, order }: { field: SortField; currentField: SortField; order: SortOrder }) {
  if (field !== currentField) {
    return (
      <svg className="ml-1 h-4 w-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    );
  }
  return order === "asc" ? (
    <svg className="ml-1 h-4 w-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
    </svg>
  ) : (
    <svg className="ml-1 h-4 w-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

export function LeadsTable() {
  const router = useRouter();
  const [leads, setLeads] = useState<LeadWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>("receivedAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch all leads (or a reasonable max) for client-side sorting
      const response = await fetch(`/api/v1/lead?limit=100`);
      const data: LeadsResponse = await response.json();

      if (data.success) {
        setLeads(data.data);
      } else {
        setError("Failed to fetch leads");
      }
    } catch {
      setError("Failed to fetch leads");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Sort leads client-side
  const sortedLeads = useMemo(() => {
    const sorted = [...leads].sort((a, b) => {
      let aVal: string | number | null;
      let bVal: string | number | null;

      switch (sortField) {
        case "receivedAt":
          aVal = new Date(a.receivedAt).getTime();
          bVal = new Date(b.receivedAt).getTime();
          break;
        case "customer":
          aVal = getCustomerName(a.user).toLowerCase();
          bVal = getCustomerName(b.user).toLowerCase();
          break;
        case "category":
          aVal = getCategoryName(a.category).toLowerCase();
          bVal = getCategoryName(b.category).toLowerCase();
          break;
        case "state":
          aVal = (a.state || "").toLowerCase();
          bVal = (b.state || "").toLowerCase();
          break;
        case "speedToLeadMs":
          aVal = a.speedToLeadMs ?? Infinity;
          bVal = b.speedToLeadMs ?? Infinity;
          break;
        case "messageCount":
          aVal = a.messageCount;
          bVal = b.messageCount;
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [leads, sortField, sortOrder]);

  // Paginate sorted leads
  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedLeads.slice(start, start + itemsPerPage);
  }, [sortedLeads, currentPage]);

  const totalPages = Math.ceil(sortedLeads.length / itemsPerPage);
  const showingStart = sortedLeads.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const showingEnd = Math.min(currentPage * itemsPerPage, sortedLeads.length);

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
    setCurrentPage(1); // Reset to first page on sort change
  };

  const handleRowClick = (leadId: string) => {
    router.push(`/leads/${leadId}`);
  };

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

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
                <TableHead
                  className="cursor-pointer select-none hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  onClick={() => handleSort("receivedAt")}
                >
                  <span className="inline-flex items-center">
                    Received
                    <SortIcon field="receivedAt" currentField={sortField} order={sortOrder} />
                  </span>
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  onClick={() => handleSort("customer")}
                >
                  <span className="inline-flex items-center">
                    Customer
                    <SortIcon field="customer" currentField={sortField} order={sortOrder} />
                  </span>
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  onClick={() => handleSort("category")}
                >
                  <span className="inline-flex items-center">
                    Category
                    <SortIcon field="category" currentField={sortField} order={sortOrder} />
                  </span>
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  onClick={() => handleSort("state")}
                >
                  <span className="inline-flex items-center">
                    State
                    <SortIcon field="state" currentField={sortField} order={sortOrder} />
                  </span>
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  onClick={() => handleSort("speedToLeadMs")}
                >
                  <span className="inline-flex items-center">
                    Speed
                    <SortIcon field="speedToLeadMs" currentField={sortField} order={sortOrder} />
                  </span>
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none text-center hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  onClick={() => handleSort("messageCount")}
                >
                  <span className="inline-flex items-center justify-center">
                    Msgs
                    <SortIcon field="messageCount" currentField={sortField} order={sortOrder} />
                  </span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedLeads.map((lead) => (
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
                    {getCategoryName(lead.category)}
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
              Showing {showingStart}–{showingEnd} of {sortedLeads.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                Previous
              </button>
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                Page {currentPage} of {totalPages || 1}
              </span>
              <button
                onClick={handleNextPage}
                disabled={currentPage >= totalPages}
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
