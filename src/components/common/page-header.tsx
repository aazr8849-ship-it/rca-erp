"use client";
import { Button } from "@/components/ui/button";
import { Plus, Download, Upload, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4", className)}>
      <div>
        <h1 className="text-xl font-semibold text-gray-800">{title}</h1>
        {description && (
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

interface ActionButtonProps {
  onClick?: () => void;
  children: React.ReactNode;
  variant?: "default" | "outline" | "ghost" | "secondary" | "destructive";
  size?: "default" | "sm";
  icon?: "add" | "export" | "import" | "refresh";
  className?: string;
  disabled?: boolean;
}

export function ActionButton({
  onClick,
  children,
  variant = "outline",
  size = "sm",
  icon,
  className,
  disabled,
}: ActionButtonProps) {
  const IconMap = {
    add: Plus,
    export: Download,
    import: Upload,
    refresh: RefreshCw,
  };
  const Icon = icon ? IconMap[icon] : null;

  return (
    <Button
      variant={variant}
      size={size}
      onClick={onClick}
      disabled={disabled}
      className={cn(icon === "add" && "bg-[#3298cb] hover:bg-[#2c87b3] text-white", className)}
    >
      {Icon && <Icon className="h-3.5 w-3.5 mr-1" />}
      {children}
    </Button>
  );
}
