"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface InfoCardProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

export function InfoCard({
  title,
  description,
  icon: Icon,
  actions,
  children,
  className,
  contentClassName,
}: InfoCardProps) {
  return (
    <Card className={cn("border-gray-200 shadow-sm", className)}>
      {(title || actions) && (
        <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0">
          <div className="flex items-center gap-2">
            {Icon && (
              <div className="w-7 h-7 rounded bg-[#38BDF8]/10 flex items-center justify-center">
                <Icon className="h-4 w-4 text-[#38BDF8]" />
              </div>
            )}
            <div>
              <CardTitle className="text-sm font-semibold text-gray-800">
                {title}
              </CardTitle>
              {description && (
                <p className="text-xs text-gray-500 mt-0.5">{description}</p>
              )}
            </div>
          </div>
          {actions}
        </CardHeader>
      )}
      <CardContent className={cn("pt-0", contentClassName)}>{children}</CardContent>
    </Card>
  );
}

interface InfoItemProps {
  label: string;
  value?: React.ReactNode;
  full?: boolean;
  labelClassName?: string;
  valueClassName?: string;
}

export function InfoItem({ label, value, full, labelClassName, valueClassName }: InfoItemProps) {
  return (
    <div className={cn("space-y-0.5", full && "sm:col-span-2")}>
      <div className={cn("text-xs text-gray-500", labelClassName)}>{label}</div>
      <div className={cn("text-sm text-gray-800 font-medium", valueClassName)}>
        {value ?? "-"}
      </div>
    </div>
  );
}
