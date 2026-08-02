"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText, Send, Check, X, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/status-badge";
import { InfoCard, InfoItem } from "@/components/common/info-card";
import { EmptyState } from "@/components/common/empty-state";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate, generateFormattedCode } from "@/lib/utils";

export default function QuotationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { quotations, orders, addAuditLog } = useStore();
  const quotation = quotations.find((q) => q.id === params.id);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState("__all__");

  if (!quotation) return <EmptyState icon={FileText} title="报价单不存在" action={<Button onClick={() => router.push("/quotations")}>返回列表</Button>} />;

  const relatedOrder = orders.find((o) => o.quotation_id === quotation.id);

  const handleAction = (action: string) => { setConfirmAction(action); setConfirmOpen(true); };

  const doAction = () => {
    if (confirmAction === "priced") {
      const items = quotation.items || [];
      const unpriced = items.filter((i) => !i.unit_price || i.unit_price <= 0);
      if (unpriced.length > 0) { toast.error(`还有 ${unpriced.length} 项未定价`); setConfirmOpen(false); return; }
      const total = items.reduce((s, i) => s + Number(i.quantity) * Number(i.unit_price), 0);
      useStore.setState((state) => ({ quotations: state.quotations.map((q) => q.id === quotation.id ? { ...q, pricing_status: "priced", total_amount: total, updated_at: new Date().toISOString() } : q) }));
      addAuditLog({ user_id: "u-admin", user_name: "管理员", module: "quotations", action: "status_change", record_id: quotation.id, record_code: quotation.code, after_data: { pricing_status: "priced", total_amount: total }, description: "报价单标记为已定价" });
      toast.success("已标记为已定价");
    } else if (confirmAction === "sent") {
      useStore.setState((state) => ({ quotations: state.quotations.map((q) => q.id === quotation.id ? { ...q, status: "sent", updated_at: new Date().toISOString() } : q) }));
      addAuditLog({ user_id: "u-admin", user_name: "管理员", module: "quotations", action: "status_change", record_id: quotation.id, record_code: quotation.code, after_data: { status: "sent" }, description: "报价单已发送给客户" });
      toast.success("已发送给客户");
    } else if (confirmAction === "accepted") {
      // 转订单
      const code = generateFormattedCode("OD");
      const deliveryDate = new Date(); deliveryDate.setDate(deliveryDate.getDate() + 60);
      const newOrder = {
        id: crypto.randomUUID(), code, customer_id: quotation.customer_id, customer_name: quotation.customer_name,
        quotation_id: quotation.id, order_date: new Date().toISOString(), delivery_date: deliveryDate.toISOString(),
        currency: quotation.currency, total_amount: quotation.total_amount, status: "pending" as const,
        trade_terms: quotation.trade_terms, payment_terms: quotation.payment_terms,
        items: (quotation.items || []).map((it) => ({ product_id: it.product_id, product_name: it.product_name, quantity: it.quantity, unit: it.unit, unit_price: it.unit_price, shipped_quantity: 0 })),
        created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      };
      useStore.setState((state) => ({
        orders: [newOrder, ...state.orders],
        quotations: state.quotations.map((q) => q.id === quotation.id ? { ...q, status: "accepted" as const, updated_at: new Date().toISOString() } : q),
      }));
      addAuditLog({ user_id: "u-admin", user_name: "管理员", module: "quotations", action: "status_change", record_id: quotation.id, record_code: quotation.code, after_data: { status: "accepted", order_id: newOrder.id }, description: `报价单 ${quotation.code} 被接受，已转为订单 ${code}` });
      toast.success(`已接受并转为订单 ${code}`);
      router.push(`/orders/${newOrder.id}`);
      setConfirmOpen(false);
      return;
    } else if (confirmAction === "rejected") {
      useStore.setState((state) => ({ quotations: state.quotations.map((q) => q.id === quotation.id ? { ...q, status: "rejected", updated_at: new Date().toISOString() } : q) }));
      addAuditLog({ user_id: "u-admin", user_name: "管理员", module: "quotations", action: "status_change", record_id: quotation.id, record_code: quotation.code, after_data: { status: "rejected" }, description: "报价单被客户拒绝" });
      toast.success("已标记为拒绝");
    }
    setConfirmOpen(false);
  };

  const actionButtons: Record<string, { label: string; variant: "default" | "destructive" | "outline"; msg: string }[]> = {
    draft: [{ label: "标记已定价", variant: "default", msg: "确认所有明细已定价？将计算总金额。" }, { label: "发送给客户", variant: "outline", msg: "确认发送给客户？发送后无法修改。" }],
    sent: [{ label: "客户接受", variant: "default", msg: "确认客户已接受此报价？将自动转为订单。" }, { label: "客户拒绝", variant: "destructive", msg: "确认客户已拒绝此报价？" }],
    accepted: [],
    rejected: [],
    expired: [],
  };
  const actionMap: Record<string, string> = { "标记已定价": "priced", "发送给客户": "sent", "客户接受": "accepted", "客户拒绝": "rejected" };
  const buttons = actionButtons[quotation.status] || [];

  const totalAmount = (quotation.items || []).reduce((s, i) => s + Number(i.quantity) * Number(i.unit_price), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-gray-800">{quotation.code}</h1>
              <StatusBadge status={quotation.status} />
              <StatusBadge status={quotation.pricing_status} />
            </div>
            <div className="text-xs text-gray-500 mt-0.5">{quotation.customer_name} · 创建于 {formatDate(quotation.created_at)}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {buttons.map((b) => (
            <Button key={b.label} onClick={() => { setConfirmAction(actionMap[b.label]); setConfirmOpen(true); }} variant={b.variant} className={b.variant === "default" ? "bg-[#3298cb] hover:bg-[#2c87b3]" : ""}>{b.label}</Button>
          ))}
          {relatedOrder && <Link href={`/orders/${relatedOrder.id}`}><Button variant="outline">查看关联订单</Button></Link>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <InfoCard title="报价信息" icon={FileText} className="lg:col-span-2">
          <div className="grid grid-cols-2 gap-x-4 gap-y-4">
            <InfoItem label="报价编码" value={<span className="font-mono">{quotation.code}</span>} />
            <InfoItem label="客户" value={<Link href={`/customers/${quotation.customer_id}`} className="text-[#3298cb] hover:underline">{quotation.customer_name}</Link>} />
            <InfoItem label="状态" value={<StatusBadge status={quotation.status} />} />
            <InfoItem label="定价状态" value={<StatusBadge status={quotation.pricing_status} />} />
            <InfoItem label="币种" value={quotation.currency} />
            <InfoItem label="总金额" value={<span className="text-[#3298cb] font-medium">{formatCurrency(quotation.total_amount || totalAmount, quotation.currency)}</span>} />
            <InfoItem label="有效期至" value={formatDate(quotation.valid_until)} />
            <InfoItem label="贸易条款" value={quotation.trade_terms || "-"} />
            <InfoItem label="付款条件" value={quotation.payment_terms || "-"} />
            <InfoItem label="创建时间" value={formatDate(quotation.created_at, "YYYY-MM-DD HH:mm")} />
          </div>
        </InfoCard>

        <InfoCard title="金额信息" icon={DollarSign}>
          <div className="space-y-3">
            <div className="bg-blue-50 rounded-md p-3"><div className="text-xs text-gray-600">报价总金额</div><div className="text-2xl font-bold text-[#3298cb] mt-1">{formatCurrency(quotation.total_amount || totalAmount, quotation.currency)}</div></div>
            <div className="bg-purple-50 rounded-md p-3"><div className="text-xs text-gray-600">明细数量</div><div className="text-2xl font-bold text-purple-600 mt-1">{(quotation.items || []).length} 项</div></div>
            {relatedOrder && <div className="bg-green-50 rounded-md p-3"><div className="text-xs text-gray-600">关联订单</div><Link href={`/orders/${relatedOrder.id}`} className="text-sm font-medium text-green-600 mt-1 block hover:underline">{relatedOrder.code}</Link></div>}
          </div>
        </InfoCard>
      </div>

      <InfoCard title="报价明细">
        <Table>
          <TableHeader><TableRow className="bg-gray-50"><TableHead className="text-xs">序号</TableHead><TableHead className="text-xs">产品名称</TableHead><TableHead className="text-xs">OEM号</TableHead><TableHead className="text-xs text-right">数量</TableHead><TableHead className="text-xs">单位</TableHead><TableHead className="text-xs text-right">单价</TableHead><TableHead className="text-xs text-right">小计</TableHead></TableRow></TableHeader>
          <TableBody>
            {(quotation.items || []).map((item, idx) => (
              <TableRow key={idx}>
                <TableCell className="text-xs">{idx + 1}</TableCell>
                <TableCell className="text-sm">{item.product_name}</TableCell>
                <TableCell className="text-xs font-mono">{item.oem_number || "-"}</TableCell>
                <TableCell className="text-sm text-right">{item.quantity}</TableCell>
                <TableCell className="text-xs">{item.unit}</TableCell>
                <TableCell className="text-sm text-right">{item.unit_price ? formatCurrency(item.unit_price, quotation.currency) : <span className="text-orange-500">待定价</span>}</TableCell>
                <TableCell className="text-sm text-right font-medium">{item.unit_price ? formatCurrency(Number(item.quantity) * Number(item.unit_price), quotation.currency) : "-"}</TableCell>
              </TableRow>
            ))}
            <TableRow className="bg-gray-50 font-medium"><TableCell colSpan={6} className="text-right text-sm">合计：</TableCell><TableCell className="text-right text-[#3298cb] text-base">{formatCurrency(quotation.total_amount || totalAmount, quotation.currency)}</TableCell></TableRow>
          </TableBody>
        </Table>
      </InfoCard>

      <ConfirmDialog open={confirmOpen} title="报价单操作确认" description={(() => { const btn = buttons.find((b) => actionMap[b.label] === confirmAction); return btn?.msg || "确认操作？"; })()} variant={confirmAction === "rejected" ? "destructive" : "default"} confirmText="确认" onConfirm={doAction} onCancel={() => setConfirmOpen(false)} />
    </div>
  );
}
