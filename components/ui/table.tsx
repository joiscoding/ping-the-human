import { cn } from "@/lib/utils";

interface TableProps {
  children: React.ReactNode;
  className?: string;
}

export function Table({ children, className }: TableProps) {
  return (
    <div className="overflow-x-auto">
      <table className={cn("w-full border-collapse text-sm", className)}>{children}</table>
    </div>
  );
}

interface TableHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function TableHeader({ children, className }: TableHeaderProps) {
  return (
    <thead
      className={cn(
        "border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50",
        className
      )}
    >
      {children}
    </thead>
  );
}

interface TableBodyProps {
  children: React.ReactNode;
  className?: string;
}

export function TableBody({ children, className }: TableBodyProps) {
  return <tbody className={cn("", className)}>{children}</tbody>;
}

interface TableRowProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  clickable?: boolean;
}

export function TableRow({ children, className, onClick, clickable }: TableRowProps) {
  return (
    <tr
      className={cn(
        "border-b border-zinc-200 dark:border-zinc-800",
        clickable && "cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50",
        className
      )}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

interface TableHeadProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function TableHead({ children, className, onClick }: TableHeadProps) {
  return (
    <th
      className={cn(
        "px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400",
        className
      )}
      onClick={onClick}
    >
      {children}
    </th>
  );
}

interface TableCellProps {
  children: React.ReactNode;
  className?: string;
}

export function TableCell({ children, className }: TableCellProps) {
  return (
    <td className={cn("px-4 py-3 text-zinc-700 dark:text-zinc-300", className)}>
      {children}
    </td>
  );
}
