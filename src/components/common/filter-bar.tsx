"use client";
import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterBarProps {
  children: ReactNode;
  onReset?: () => void;
  className?: string;
}

export function FilterBar({ children, onReset, className }: FilterBarProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 p-3 bg-white rounded-md border border-gray-200 mb-4",
        className,
      )}
    >
      {children}
      {onReset && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="ml-auto text-xs text-gray-500 hover:text-gray-700"
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          重置
        </Button>
      )}
    </div>
  );
}
