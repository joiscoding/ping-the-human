import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface User {
  id: string;
  email: string | null;
  phone: string | null;
  firstName: string | null;
  lastName: string | null;
  createdAt: string;
}

interface OtherLead {
  id: string;
  category: string | null;
  status: string;
  receivedAt: string;
  description: string | null;
}

interface CustomerPanelProps {
  user: User | null;
  otherLeads: OtherLead[];
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatPhone(phone: string | null): string {
  if (!phone) return "—";
  // Format as (XXX) XXX-XXXX if 10 digits
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

export function CustomerPanel({ user, otherLeads }: CustomerPanelProps) {
  const customerName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(" ") || "Unknown"
    : "Unknown";

  return (
    <div className="space-y-4">
      {/* Customer Info */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Customer Info</CardTitle>
        </CardHeader>
        <CardContent>
          {user ? (
            <div className="space-y-3">
              <div>
                <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  {customerName}
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4 text-zinc-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="text-zinc-700 dark:text-zinc-300">
                    {user.email || "—"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4 text-zinc-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  <span className="text-zinc-700 dark:text-zinc-300">
                    {formatPhone(user.phone)}
                  </span>
                </div>

                <div className="pt-2 text-xs text-zinc-500 dark:text-zinc-500">
                  Customer since {formatDate(user.createdAt)}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No customer information available
            </p>
          )}
        </CardContent>
      </Card>

      {/* Other Leads */}
      {otherLeads.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Other Leads ({otherLeads.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {otherLeads.map((lead) => (
                <Link
                  key={lead.id}
                  href={`/leads/${lead.id}`}
                  className="block rounded-lg border border-zinc-200 p-3 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {lead.category || "Unknown"}
                  </div>
                  <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    {formatDate(lead.receivedAt)}
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
