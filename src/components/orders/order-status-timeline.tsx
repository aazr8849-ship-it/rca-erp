"use client";
import { Check, Clock, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_FLOW = [
  { key: "pending", label: "待处理" },
  { key: "confirmed", label: "已确认" },
  { key: "producing", label: "生产中" },
  { key: "shipped", label: "已发货" },
  { key: "completed", label: "已完成" },
];

export function OrderStatusTimeline({ currentStatus }: { currentStatus: string }) {
  const currentIndex = STATUS_FLOW.findIndex((s) => s.key === currentStatus);
  const isCancelled = currentStatus === "cancelled";

  if (isCancelled) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center"><X className="h-4 w-4" /></div>
        <div>
          <div className="text-sm font-medium text-red-700">订单已取消</div>
          <div className="text-xs text-red-500">该订单已取消，所有关联业务已回滚</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-md p-6">
      <div className="flex items-center justify-between w-full">
        {STATUS_FLOW.map((status, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isFuture = index > currentIndex;
          return (
            <div key={status.key} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                  isCompleted && "bg-green-500 border-green-500 text-white",
                  isCurrent && "bg-[#3298cb] border-[#3298cb] text-white animate-pulse",
                  isFuture && "bg-gray-100 border-gray-300 text-gray-400",
                )}>
                  {isCompleted ? <Check size={18} /> : isCurrent ? <Clock size={18} /> : <Circle size={18} />}
                </div>
                <div className="mt-2 text-center">
                  <div className={cn("text-sm font-medium", isFuture ? "text-gray-400" : "text-gray-800")}>{status.label}</div>
                </div>
              </div>
              {index < STATUS_FLOW.length - 1 && (
                <div className={cn("flex-1 h-0.5 mx-2 transition-colors", index < currentIndex ? "bg-green-500" : "bg-gray-200")} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function X({ size }: { size: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
}
