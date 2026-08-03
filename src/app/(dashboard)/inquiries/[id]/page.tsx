"use client";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MessageSquare, FileText, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/status-badge";
import { InfoCard, InfoItem } from "@/components/common/info-card";
import { EmptyState } from "@/components/common/empty-state";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate, SOURCE_LABELS, generateFormattedCode } from "@/lib/utils";

export default function InquiryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { inquiries, quotations, addAuditLog } = useStore();
  const inquiry = inquiries.find((i) => i.id === params.id);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<string>("");

  if (!inquiry) return <EmptyState icon={MessageSquare} title="询盘不存在" action={<Button onClick={() => router.push("/inquiries")}>返回列表</Button>} />;

  const relatedQuotations = quotations.filter((q) => q.inquiry_id === inquiry.id);

  const statusFlow: Record<string, string[]> = {
    pending: ["processing", "cancelled"],
    processing: ["quoted", "cancelled"],
    quoted: ["closed", "cancelled"],
    closed: [],
    cancelled: [],
  };
  const statusLabels: Record<string, string> = { processing: "开始处理", quoted: "标记已报价", closed: "关闭询盘", cancelled: "取消询盘" };
  const confirmMsgs: Record<string, string> = {
    processing: "确认开始处理此询盘？",
    quoted: "确认将此询盘标记为已报价？",
    closed: "确认关闭此询盘？",
    cancelled: "确认取消此询盘？取消后无法恢复。",
  };

  const handleStatusChange = (to: string) => {
    setConfirmAction(to);
    setConfirmOpen(true);
  };

  const doStatusChange = () => {
    const from = inquiry.status;
    useStore.setState((state) => ({
      inquiries: state.inquiries.map((i) => i.id === inquiry.id ? { ...i, status: confirmAction as any, updated_at: new Date().toISOString() } : i),
    }));
    addAuditLog({ user_id: "u-admin", user_name: "管理员", module: "inquiries", action: "status_change", record_id: inquiry.id, record_code: inquiry.code, before_data: { status: from }, after_data: { status: confirmAction }, description: `询盘状态变更：${from} → ${confirmAction}` });
    toast.success("状态变更成功");
    setConfirmOpen(false);
  };

  const handleConvertToQuotation = () => {
    const code = generateFormattedCode("QT");
    const validUntil = new Date(); validUntil.setDate(validUntil.getDate() + 30);
    const newQuotation = {
      id: crypto.randomUUID(),
      code, customer_id: inquiry.customer_id, customer_name: inquiry.customer_name,
      inquiry_id: inquiry.id, pricing_status: "pending" as const, status: "draft" as const,
      total_amount: 0, currency: "USD", valid_until: validUntil.toISOString(),
      trade_terms: "FOB", payment_terms: "T/T",
      items: (inquiry.items || []).map((it) => ({ product_id: it.product_id, product_name: it.product_name, quantity: it.quantity, unit: it.unit, unit_price: 0, total_price: 0 })),
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    };
    useStore.setState((state) => ({
      quotations: [newQuotation, ...state.quotations],
      inquiries: state.inquiries.map((i) => i.id === inquiry.id ? { ...i, status: "quoted" as const, updated_at: new Date().toISOString() } : i),
    }));
    addAuditLog({ user_id: "u-admin", user_name: "管理员", module: "inquiries", action: "status_change", record_id: inquiry.id, record_code: inquiry.code, after_data: { status: "quoted", quotation_id: newQuotation.id }, description: `询盘 ${inquiry.code} 转为报价单 ${code}` });
    toast.success(`已转为报价单 ${code}`);
    router.push(`/quotations/${newQuotation.id}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-gray-800">{inquiry.code}</h1>
              <StatusBadge type="priority" status={inquiry.priority} />
              <StatusBadge status={inquiry.status} />
            </div>
            <div className="text-xs text-gray-500 mt-0.5">{inquiry.subject} · 创建于 {formatDate(inquiry.created_at)}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {(inquiry.status === "processing" || inquiry.status === "quoted") && (
            <Button onClick={handleConvertToQuotation} variant="outline"><FileText className="h-3.5 w-3.5 mr-1.5" />转为报价单</Button>
          )}
          {statusFlow[inquiry.status]?.map((to) => (
            <Button key={to} onClick={() => handleStatusChange(to)} variant={to === "cancelled" ? "destructive" : "default"} className={to !== "cancelled" ? "bg-[#38BDF8] hover:bg-[#0EA5E9]" : ""}>
              {statusLabels[to]}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <InfoCard title="询盘信息" icon={MessageSquare} className="lg:col-span-2">
          <div className="grid grid-cols-2 gap-x-4 gap-y-4">
            <InfoItem label="询盘编码" value={<span className="font-mono">{inquiry.code}</span>} />
            <InfoItem label="主题" value={inquiry.subject} />
            <InfoItem label="客户" value={<Link href={`/customers/${inquiry.customer_id}`} className="text-[#38BDF8] hover:underline">{inquiry.customer_name}</Link>} />
            <InfoItem label="客户国家" value={inquiry.customer_country || "-"} />
            <InfoItem label="来源" value={SOURCE_LABELS[inquiry.source]} />
            <InfoItem label="优先级" value={<StatusBadge type="priority" status={inquiry.priority} />} />
            <InfoItem label="状态" value={<StatusBadge status={inquiry.status} />} />
            <InfoItem label="创建时间" value={formatDate(inquiry.created_at, "YYYY-MM-DD HH:mm")} />
            {inquiry.notes && <InfoItem label="备注" full value={<span className="text-xs">{inquiry.notes}</span>} />}
          </div>
        </InfoCard>

        <InfoCard title="关联报价单">
          <div className="space-y-2">
            {relatedQuotations.length === 0 ? <div className="text-center py-6 text-sm text-gray-500">暂无关联报价</div> : relatedQuotations.map((q) => (
              <Link key={q.id} href={`/quotations/${q.id}`} className="flex items-center justify-between p-2.5 rounded border border-gray-100 hover:bg-gray-50">
                <div><div className="text-xs font-mono text-[#38BDF8]">{q.code}</div><div className="text-xs text-gray-500">{formatCurrency(q.total_amount, q.currency)}</div></div>
                <StatusBadge status={q.status} />
              </Link>
            ))}
          </div>
        </InfoCard>
      </div>

      <InfoCard title="询盘明细" icon={ShoppingCart}>
        <Table>
          <TableHeader><TableRow className="bg-gray-50"><TableHead className="text-xs">序号</TableHead><TableHead className="text-xs">产品名称</TableHead><TableHead className="text-xs">OEM号</TableHead><TableHead className="text-xs text-right">数量</TableHead><TableHead className="text-xs">单位</TableHead><TableHead className="text-xs text-right">目标价</TableHead><TableHead className="text-xs">备注</TableHead></TableRow></TableHeader>
          <TableBody>
            {(inquiry.items || []).map((item, idx) => (
              <TableRow key={idx}>
                <TableCell className="text-xs">{idx + 1}</TableCell>
                <TableCell className="text-sm">{item.product_name || item.product_id}</TableCell>
                <TableCell className="text-xs font-mono">{item.oem_number || "-"}</TableCell>
                <TableCell className="text-sm text-right">{item.quantity}</TableCell>
                <TableCell className="text-xs">{item.unit}</TableCell>
                <TableCell className="text-sm text-right">{item.target_price ? formatCurrency(item.target_price, "USD") : "-"}</TableCell>
                <TableCell className="text-xs text-gray-500">{item.notes || "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </InfoCard>

      <ConfirmDialog open={confirmOpen} title="询盘状态变更" description={confirmMsgs[confirmAction]} variant={confirmAction === "cancelled" ? "destructive" : "default"} onConfirm={doStatusChange} onCancel={() => setConfirmOpen(false)} />
    </div>
  );
}
