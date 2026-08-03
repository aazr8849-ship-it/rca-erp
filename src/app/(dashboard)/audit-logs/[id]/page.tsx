"use client";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, History } from "lucide-react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/status-badge";
import { InfoCard, InfoItem } from "@/components/common/info-card";
import { EmptyState } from "@/components/common/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, ACTION_LABELS, MODULE_LABELS } from "@/lib/utils";

export default function AuditLogDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { auditLogs } = useStore();
  const log = auditLogs.find((l) => l.id === params.id);

  if (!log) return <EmptyState icon={History} title="日志不存在" action={<Button onClick={() => router.push("/audit-logs")}>返回列表</Button>} />;

  const allKeys = Array.from(new Set([...(log.before_data ? Object.keys(log.before_data) : []), ...(log.after_data ? Object.keys(log.after_data) : [])]));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h1 className="text-xl font-semibold text-gray-800">操作日志详情</h1>
          <div className="text-xs text-gray-500 mt-0.5">{formatDate(log.created_at, "YYYY-MM-DD HH:mm:ss")} · {log.user_name}</div>
        </div>
      </div>

      <InfoCard title="基本信息" icon={History}>
        <div className="grid grid-cols-2 gap-x-4 gap-y-4">
          <InfoItem label="日志ID" value={<span className="font-mono text-xs">{log.id}</span>} />
          <InfoItem label="操作时间" value={formatDate(log.created_at, "YYYY-MM-DD HH:mm:ss")} />
          <InfoItem label="操作人" value={log.user_name || "-"} />
          <InfoItem label="操作人ID" value={<span className="font-mono text-xs">{log.user_id}</span>} />
          <InfoItem label="模块" value={MODULE_LABELS[log.module] || log.module} />
          <InfoItem label="操作类型" value={<StatusBadge status={log.action} customLabel={ACTION_LABELS[log.action]} />} />
          <InfoItem label="记录编码" value={<span className="font-mono text-xs">{log.record_code || "-"}</span>} />
          <InfoItem label="记录ID" value={<span className="font-mono text-xs">{log.record_id || "-"}</span>} />
          <InfoItem label="操作描述" full value={<span className="text-sm">{log.description}</span>} />
        </div>
      </InfoCard>

      {(log.before_data || log.after_data) && (
        <InfoCard title="数据变更对比">
          <Table>
            <TableHeader><TableRow className="bg-gray-50"><TableHead className="text-xs">字段</TableHead><TableHead className="text-xs">旧值</TableHead><TableHead className="text-xs">新值</TableHead></TableRow></TableHeader>
            <TableBody>
              {allKeys.map((key) => {
                const beforeVal = log.before_data?.[key];
                const afterVal = log.after_data?.[key];
                const changed = JSON.stringify(beforeVal) !== JSON.stringify(afterVal);
                return (
                  <TableRow key={key} className={changed ? "bg-yellow-50" : ""}>
                    <TableCell className="text-xs font-medium">{key}</TableCell>
                    <TableCell className="text-xs text-gray-500">{beforeVal === undefined ? "-" : JSON.stringify(beforeVal)}</TableCell>
                    <TableCell className={`text-xs ${changed ? "font-medium text-green-700" : "text-gray-500"}`}>{afterVal === undefined ? "-" : JSON.stringify(afterVal)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </InfoCard>
      )}
    </div>
  );
}
