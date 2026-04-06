import { cn } from "@/lib/utils";

type Status = "Completed" | "Filed" | "Pending" | "InProgress" | "Overdue" | "Active" | "Inactive" | "Low" | "Medium" | "High" | "Critical";

const statusConfig: Record<string, { label: string; className: string }> = {
  Completed: { label: "Completed", className: "bg-green-100 text-green-800 border-green-200" },
  Filed: { label: "Filed", className: "bg-green-100 text-green-800 border-green-200" },
  Active: { label: "Active", className: "bg-green-100 text-green-800 border-green-200" },
  Pending: { label: "Pending", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  InProgress: { label: "In Progress", className: "bg-blue-100 text-blue-800 border-blue-200" },
  Overdue: { label: "Overdue", className: "bg-red-100 text-red-800 border-red-200" },
  Inactive: { label: "Inactive", className: "bg-gray-100 text-gray-600 border-gray-200" },
  Low: { label: "Low", className: "bg-gray-100 text-gray-600 border-gray-200" },
  Medium: { label: "Medium", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  High: { label: "High", className: "bg-orange-100 text-orange-800 border-orange-200" },
  Critical: { label: "Critical", className: "bg-red-100 text-red-800 border-red-200" },
};

export default function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] ?? { label: status, className: "bg-gray-100 text-gray-600 border-gray-200" };
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border", config.className)}>
      {config.label}
    </span>
  );
}
