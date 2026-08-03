"use client";
import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Truck, Phone, Mail, MapPin, Building2, Pencil } from "lucide-react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/common/status-badge";
import { InfoCard, InfoItem } from "@/components/common/info-card";
import { GenericDataTable, type Column } from "@/components/common/data-table";
import { EmptyState } from "@/components/common/empty-state";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StarRating } from "../page";

export default function SupplierDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { suppliers, products, purchaseOrders, payables } = useStore();
  const supplier = suppliers.find((s) => s.id === params.id);

  const supplierProducts = useMemo(() => products.filter((p) => p.status === "active").slice(0, 5), [products]);
  const supplierPOs = useMemo(() => purchaseOrders.filter((p) => p.supplier_id === params.id), [purchaseOrders, params.id]);
  const supplierPays = useMemo(() => payables.filter((p) => p.supplier_id === params.id), [payables, params.id]);

  if (!supplier) {
    return <EmptyState icon={Truck} title="供应商不存在" description="该供应商可能已被删除或ID错误" action={<Button onClick={() => router.push("/suppliers")}>返回列表</Button>} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-gray-800">{supplier.name}</h1>
              <StatusBadge status={supplier.status} />
              <StatusBadge type="level" status={supplier.level} />
            </div>
            <div className="text-xs text-gray-500 mt-0.5">编码 {supplier.code} · 创建于 {formatDate(supplier.created_at)}</div>
          </div>
        </div>
        <Button onClick={() => router.push("/suppliers")} className="bg-[#38BDF8] hover:bg-[#0EA5E9]"><Pencil className="h-3.5 w-3.5 mr-1.5" />编辑信息</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <InfoCard title="基本信息" icon={Building2} className="lg:col-span-2">
          <div className="grid grid-cols-2 gap-x-4 gap-y-4">
            <InfoItem label="供应商编码" value={<span className="font-mono">{supplier.code}</span>} />
            <InfoItem label="供应商名称" value={supplier.name} />
            <InfoItem label="英文名称" value={supplier.name_en || "-"} />
            <InfoItem label="联系人" value={supplier.contact_person} />
            <InfoItem label="联系邮箱" value={supplier.contact_email ? <a href={`mailto:${supplier.contact_email}`} className="text-[#38BDF8] hover:underline flex items-center gap-1"><Mail className="h-3 w-3" />{supplier.contact_email}</a> : "-"} />
            <InfoItem label="联系电话" value={supplier.contact_phone ? <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{supplier.contact_phone}</span> : "-"} />
            <InfoItem label="国家" value={supplier.country} />
            <InfoItem label="地址" value={supplier.address ? <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{supplier.address}</span> : "-"} />
            <InfoItem label="等级" value={<StatusBadge type="level" status={supplier.level} />} />
            <InfoItem label="状态" value={<StatusBadge status={supplier.status} />} />
            <InfoItem label="主营品类" value={<div className="flex flex-wrap gap-1">{(supplier.main_category || []).map((c, i) => <span key={i} className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">{c}</span>)}</div>} />
            <InfoItem label="平均交期" value={`${supplier.lead_time_days} 天`} />
            <InfoItem label="付款条件" value={supplier.payment_terms} />
            <InfoItem label="质量评级" value={<StarRating value={supplier.quality_rating} readOnly size={16} />} />
            {supplier.notes && <InfoItem label="备注" full value={<span className="text-xs">{supplier.notes}</span>} />}
          </div>
        </InfoCard>

        <InfoCard title="业务概览">
          <div className="space-y-3">
            <div className="bg-blue-50 rounded-md p-3"><div className="text-xs text-gray-600">采购订单</div><div className="text-2xl font-bold text-[#38BDF8] mt-1">{supplierPOs.length}</div></div>
            <div className="bg-orange-50 rounded-md p-3"><div className="text-xs text-gray-600">应付账款</div><div className="text-2xl font-bold text-orange-600 mt-1">{supplierPays.length}</div></div>
            <div className="bg-green-50 rounded-md p-3"><div className="text-xs text-gray-600">累计采购金额</div><div className="text-xl font-bold text-green-600 mt-1">{formatCurrency(supplierPOs.reduce((s, p) => s + Number(p.total_amount), 0), "CNY")}</div></div>
          </div>
        </InfoCard>
      </div>

      <Tabs defaultValue="products">
        <TabsList>
          <TabsTrigger value="products">供货产品</TabsTrigger>
          <TabsTrigger value="purchases">采购记录 ({supplierPOs.length})</TabsTrigger>
          <TabsTrigger value="payables">应付记录 ({supplierPays.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="products" className="mt-3">
          <GenericDataTable data={supplierProducts} columns={[
            { key: "code", header: "编码", render: (r) => <Link href={`/products/${r.id}`} className="text-[#38BDF8] hover:underline text-xs font-mono">{r.code}</Link> },
            { key: "name", header: "产品名称", render: (r) => <Link href={`/products/${r.id}`} className="text-sm hover:underline">{r.name}</Link> },
            { key: "oem_number", header: "OEM号", render: (r) => <span className="text-xs font-mono">{r.oem_number}</span> },
            { key: "brand", header: "品牌" },
            { key: "cost_price", header: "成本价", align: "right", render: (r) => formatCurrency(r.cost_price, "CNY") },
            { key: "sale_price", header: "销售价", align: "right", render: (r) => formatCurrency(r.sale_price, "USD") },
          ]} emptyTitle="暂无供货产品" />
        </TabsContent>
        <TabsContent value="purchases" className="mt-3">
          <GenericDataTable data={supplierPOs} columns={[
            { key: "code", header: "采购单号", render: (r) => <Link href={`/purchases/${r.id}`} className="text-[#38BDF8] hover:underline text-xs font-mono">{r.code}</Link> },
            { key: "order_date", header: "下单日期", render: (r) => formatDate(r.order_date) },
            { key: "total_amount", header: "金额", align: "right", render: (r) => formatCurrency(r.total_amount, r.currency) },
            { key: "status", header: "状态", render: (r) => <StatusBadge status={r.status} /> },
          ]} emptyTitle="暂无采购记录" />
        </TabsContent>
        <TabsContent value="payables" className="mt-3">
          <GenericDataTable data={supplierPays} columns={[
            { key: "code", header: "应付编号", render: (r) => <span className="text-xs font-mono">{r.code}</span> },
            { key: "category", header: "类别" },
            { key: "amount", header: "金额", align: "right", render: (r) => formatCurrency(r.amount, r.currency) },
            { key: "due_date", header: "到期日", render: (r) => formatDate(r.due_date) },
            { key: "status", header: "状态", render: (r) => <StatusBadge status={r.status} /> },
          ]} emptyTitle="暂无应付记录" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
