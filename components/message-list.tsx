import { cn } from "@/lib/utils";

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

interface MessageListProps {
  messages: Message[];
}

function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function MessageCard({ message }: { message: Message }) {
  const isOutbound = message.direction === "outbound";

  return (
    <div
      className={cn(
        "rounded-lg border p-4",
        isOutbound
          ? "border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30"
          : "border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50"
      )}
    >
      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded-full text-xs",
              isOutbound
                ? "bg-blue-200 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                : "bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300"
            )}
          >
            {isOutbound ? "↑" : "↓"}
          </span>
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {isOutbound ? "Outbound" : "Inbound"}
          </span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            • {message.channel}
          </span>
        </div>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {formatDateTime(message.createdAt)}
        </span>
      </div>

      {/* Subject (for emails) */}
      {message.subject && (
        <div className="mb-2 text-sm font-medium text-zinc-800 dark:text-zinc-200">
          {message.subject}
        </div>
      )}

      {/* Body */}
      <div className="whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-400">
        {message.body}
      </div>

      {/* Sent timestamp */}
      {message.sentAt && (
        <div className="mt-3 text-xs text-zinc-500 dark:text-zinc-500">
          Sent: {formatDateTime(message.sentAt)}
        </div>
      )}
    </div>
  );
}

export function MessageList({ messages }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="py-8 text-center text-zinc-500 dark:text-zinc-400">
        No messages yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <MessageCard key={message.id} message={message} />
      ))}
    </div>
  );
}
