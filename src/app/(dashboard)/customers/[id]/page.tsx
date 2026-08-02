"use client";
import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil, Phone, Mail, Globe, MapPin, Building2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/common/status-badge";
import { InfoCard, InfoItem } from "@/components/common/info-card";
import { GenericDataTable, type Column } from "@/components/common/data-table";
import { EmptyState } from "@/components/common/empty-state";
import { formatCurrency, formatDate, SOURCE_LABELS, getStatusLabel } from "@/lib/utils";
import type { Inquiry, Order, Quotation } from "@/lib/types";
import { FileText, MessageSquare, ShoppingCart } from "lucide-react";

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { customers, inquiries, quotations, orders } = useStore();
  const customerId = params.id as string;
  const customer = customers.find((c) => c.id === customerId);

  // 该客户的询盘/报价/订单
  const customerInquiries = useMemo(
    () => inquiries.filter((i) => i.customer_id === customerId),
    [inquiries, customerId],
  );
  const customerQuotations = useMemo(
    () => quotations.filter((q) => q.customer_id === customerId),
    [quotations, customerId],
  );
  const customerOrders = useMemo(
    () => orders.filter((o) => o.customer_id === customerId),
    [orders, customerId],
  );

  if (!customer) {
    return (
      <EmptyState
        icon={Building2}
        title="客户不存在"
        description="该客户可能已被删除或ID错误"
        action={
          <Button onClick={() => router.push("/customers")}>返回客户列表</Button>
        }
      />
    );
  }

  const inquiryColumns: Column<Inquiry>[] = [
    { key: "code", header: "询盘号", render: (r) => <Link href={`/inquiries/${r.id}`} className="text-[#3298cb] hover:underline text-xs font-mono">{r.code}</Link> },
    { key: "subject", header: "主题", render: (r) => <span className="text-sm">{r.subject}</span> },
    { key: "source", header: "来源", render: (r) => <span className="text-xs">{SOURCE_LABELS[r.source]}</span> },
    { key: "priority", header: "优先级", render: (r) => <StatusBadge type="priority" status={r.priority} /> },
    { key: "status", header: "状态", render: (r) => <StatusBadge status={r.status} /> },
    { key: "created_at", header: "创建时间", render: (r) => <span className="text-xs text-gray-500">{formatDate(r.created_at)}</span> },
  ];

  const quotationColumns: Column<Quotation>[] = [
    { key: "code", header: "报价号", render: (r) => <Link href={`/quotations/${r.id}`} className="text-[#3298cb] hover:underline text-xs font-mono">{r.code}</Link> },
    { key: "status", header: "状态", render: (r) => <StatusBadge status={r.status} /> },
    { key: "total_amount", header: "金额", align: "right", render: (r) => <span className="text-sm font-medium">{formatCurrency(r.total_amount, r.currency)}</span> },
    { key: "valid_until", header: "有效期至", render: (r) => <span className="text-xs">{formatDate(r.valid_until)}</span> },
    { key: "created_at", header: "创建时间", render: (r) => <span className="text-xs text-gray-500">{formatDate(r.created_at)}</span> },
  ];

  const orderColumns: Column<Order>[] = [
    { key: "code", header: "订单号", render: (r) => <Link href={`/orders/${r.id}`} className="text-[#3298cb] hover:underline text-xs font-mono">{r.code}</Link> },
    { key: "status", header: "状态", render: (r) => <StatusBadge status={r.status} /> },
    { key: "total_amount", header: "金额", align: "right", render: (r) => <span className="text-sm font-medium">{formatCurrency(r.total_amount, r.currency)}</span> },
    { key: "order_date", header: "下单日期", render: (r) => <span className="text-xs">{formatDate(r.order_date)}</span> },
    { key: "delivery_date", header: "交货日期", render: (r) => <span className="text-xs">{formatDate(r.delivery_date)}</span> },
  ];

  return (
    <div className="space-y-4">
      {/* 顶部 */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-gray-800">{customer.name}</h1>
              <StatusBadge status={customer.status} />
              <StatusBadge type="level" status={customer.level} />
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              编码 {customer.code} · 创建于 {formatDate(customer.created_at)}
            </div>
          </div>
        </div>
        <Button
          onClick={() => router.push("/customers")}
          className="bg-[#3298cb] hover:bg-[#2c87b3]"
        >
          <Pencil className="h-3.5 w-3.5 mr-1.5" />
          编辑信息
        </Button>
      </div>

      {/* 基本信息 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <InfoCard title="基本信息" icon={Building2} className="lg:col-span-2">
          <div className="grid grid-cols-2 gap-x-4 gap-y-4">
            <InfoItem label="客户编码" value={<span className="font-mono">{customer.code}</span>} />
            <InfoItem label="客户名称" value={customer.name} />
            <InfoItem label="英文名称" value={customer.name_en || "-"} />
            <InfoItem label="联系人" value={customer.contact_person} />
            <InfoItem label="联系邮箱" value={
              customer.contact_email ? (
                <a href={`mailto:${customer.contact_email}`} className="text-[#3298cb] hover:underline flex items-center gap-1">
                  <Mail className="h-3 w-3" />{customer.contact_email}
                </a>
              ) : "-"
            } />
            <InfoItem label="联系电话" value={
              customer.contact_phone ? (
                <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{customer.contact_phone}</span>
              ) : "-"
            } />
            <InfoItem label="国家" value={customer.country} />
            <InfoItem label="地址" value={
              customer.address ? (
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{customer.address}</span>
              ) : "-"
            } />
            <InfoItem label="官网" value={
              customer.website ? (
                <a href={`https://${customer.website}`} target="_blank" rel="noopener noreferrer" className="text-[#3298cb] hover:underline flex items-center gap-1">
                  <Globe className="h-3 w-3" />{customer.website}
                </a>
              ) : "-"
            } />
            <InfoItem label="等级" value={<StatusBadge type="level" status={customer.level} />} />
            <InfoItem label="状态" value={<StatusBadge status={customer.status} />} />
            <InfoItem label="信用额度" value={formatCurrency(customer.credit_limit, customer.preferred_currency)} />
            <InfoItem label="付款条件" value={customer.payment_terms} />
            <InfoItem label="偏好币种" value={customer.preferred_currency} />
            {customer.notes && <InfoItem label="备注" full value={<span className="text-xs">{customer.notes}</span>} />}
          </div>
        </InfoCard>

        {/* 业务统计 */}
        <InfoCard title="业务概览">
          <div className="space-y-3">
            <div className="bg-blue-50 rounded-md p-3">
              <div className="text-xs text-gray-600">询盘总数</div>
              <div className="text-2xl font-bold text-[#3298cb] mt-1">{customerInquiries.length}</div>
            </div>
            <div className="bg-purple-50 rounded-md p-3">
              <div className="text-xs text-gray-600">报价总数</div>
              <div className="text-2xl font-bold text-purple-600 mt-1">{customerQuotations.length}</div>
            </div>
            <div className="bg-orange-50 rounded-md p-3">
              <div className="text-xs text-gray-600">订单总数</div>
              <div className="text-2xl font-bold text-orange-600 mt-1">{customerOrders.length}</div>
            </div>
            <div className="bg-green-50 rounded-md p-3">
              <div className="text-xs text-gray-600">累计订单金额</div>
              <div className="text-xl font-bold text-green-600 mt-1">
                {formatCurrency(
                  customerOrders.reduce((s, o) => s + Number(o.total_amount), 0),
                  customer.preferred_currency,
                )}
              </div>
            </div>
          </div>
        </InfoCard>
      </div>

      {/* 关联记录 */}
      <Tabs defaultValue="inquiries">
        <TabsList>
          <TabsTrigger value="inquiries">
            <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
            询盘记录 ({customerInquiries.length})
          </TabsTrigger>
          <TabsTrigger value="quotations">
            <FileText className="h-3.5 w-3.5 mr-1.5" />
            报价记录 ({customerQuotations.length})
          </TabsTrigger>
          <TabsTrigger value="orders">
            <ShoppingCart className="h-3.5 w-3.5 mr-1.5" />
            订单记录 ({customerOrders.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="inquiries" className="mt-3">
          <GenericDataTable data={customerInquiries} columns={inquiryColumns} emptyTitle="暂无询盘记录" />
        </TabsContent>
        <TabsContent value="quotations" className="mt-3">
          <GenericDataTable data={customerQuotations} columns={quotationColumns} emptyTitle="暂无报价记录" />
        </TabsContent>
        <TabsContent value="orders" className="mt-3">
          <GenericDataTable data={customerOrders} columns={orderColumns} emptyTitle="暂无订单记录" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
