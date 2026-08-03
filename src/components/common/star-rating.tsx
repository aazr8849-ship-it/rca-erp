"use client";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number;
  onChange?: (v: number) => void;
  readOnly?: boolean;
  size?: number;
  className?: string;
}

export function StarRating({
  value,
  onChange,
  readOnly,
  size = 16,
  className,
}: StarRatingProps) {
  return (
    <div className={cn("inline-flex items-center gap-0.5", className)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(n)}
          className={cn(
            "inline-flex items-center justify-center",
            !readOnly && "hover:scale-110 transition-transform",
            readOnly && "cursor-default",
          )}
          aria-label={`${n} 星`}
        >
          <Star
            style={{ width: size, height: size }}
            className={
              n <= value
                ? "fill-yellow-400 text-yellow-400"
                : "fill-gray-200 text-gray-300"
            }
          />
        </button>
      ))}
    </div>
  );
}
