"use client";
import { Badge } from "@/components/ui/badge";
import { cn, getStatusColor, getStatusLabel, LEVEL_LABELS, LEVEL_COLORS, PRIORITY_LABELS, PRIORITY_COLORS } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  type?: "status" | "level" | "priority";
  customLabel?: string;
  className?: string;
}

export function StatusBadge({ status, type = "status", customLabel, className }: StatusBadgeProps) {
  // 等级类型
  if (type === "level") {
    return (
      <Badge variant={LEVEL_COLORS[status] || "secondary"} className={cn("text-xs", className)}>
        {LEVEL_LABELS[status] || status}
      </Badge>
    );
  }

  // 优先级类型
  if (type === "priority") {
    return (
      <Badge variant={PRIORITY_COLORS[status] || "secondary"} className={cn("text-xs", className)}>
        {PRIORITY_LABELS[status] || status}
      </Badge>
    );
  }

  // 通用状态
  const color = getStatusColor(status);
  const label = customLabel || getStatusLabel(status);

  const colorClassMap: Record<string, string> = {
    default: "bg-[#3298cb] text-white hover:bg-[#3298cb]",
    secondary: "bg-gray-100 text-gray-700 hover:bg-gray-100",
    destructive: "bg-red-100 text-red-700 hover:bg-red-100",
    outline: "bg-white text-gray-600 border border-gray-300 hover:bg-white",
    success: "bg-green-100 text-green-700 hover:bg-green-100",
    warning: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
    info: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
        colorClassMap[color] || colorClassMap.secondary,
        className,
      )}
    >
      {label}
    </span>
  );
}
