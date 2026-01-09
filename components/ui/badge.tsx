import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "pending" | "processed" | "duplicate" | "success" | "error";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  processed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  duplicate: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  success: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  error: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export function Badge({ variant = "default", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

/**
 * Helper to get badge variant from lead status
 */
export function getStatusVariant(status: string): BadgeVariant {
  switch (status) {
    case "pending":
      return "pending";
    case "processed":
      return "processed";
    case "duplicate":
      return "duplicate";
    default:
      return "default";
  }
}
