"use client";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Package, Pencil, Phone, Layers } from "lucide-react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/common/status-badge";
import { InfoCard, InfoItem } from "@/components/common/info-card";
import { EmptyState } from "@/components/common/empty-state";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { products, inventory, stockMovements } = useStore();
  const product = products.find((p) => p.id === params.id);
  const stock = inventory.find((i) => i.product_id === params.id);
  const movements = stockMovements.filter((m) => m.product_id === params.id).slice(0, 20);

  if (!product) return <EmptyState icon={Package} title="产品不存在" action={<Button onClick={() => router.push("/products")}>返回列表</Button>} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-gray-800">{product.name}</h1>
              <StatusBadge status={product.status} />
            </div>
            <div className="text-xs text-gray-500 mt-0.5">编码 {product.code} · OEM {product.oem_number || "-"} · 创建于 {formatDate(product.created_at)}</div>
          </div>
        </div>
        <Button onClick={() => router.push("/products")} className="bg-[#38BDF8] hover:bg-[#0EA5E9]"><Pencil className="h-3.5 w-3.5 mr-1.5" />编辑信息</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <InfoCard title="基本信息" icon={Package} className="lg:col-span-2">
          {/* 产品图片画廊 */}
          {product.image_urls && product.image_urls.length > 0 && (
            <div className="mb-4 pb-4 border-b border-slate-100">
              <div className="text-xs text-slate-500 mb-2">产品图片 ({product.image_urls.length})</div>
              <div className="flex flex-wrap gap-2">
                {product.image_urls.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`relative w-20 h-20 rounded-md overflow-hidden border-2 hover:border-[#38BDF8] transition-colors ${i === 0 ? "border-[#38BDF8]" : "border-slate-200"}`}
                  >
                    <img src={url} alt={`产品图片${i + 1}`} className="w-full h-full object-cover" />
                    {i === 0 && <span className="absolute bottom-0 left-0 right-0 bg-[#38BDF8]/90 text-white text-[9px] text-center py-0.5">主图</span>}
                  </a>
                ))}
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-x-4 gap-y-4">
            <InfoItem label="产品编码" value={<span className="font-mono">{product.code}</span>} />
            <InfoItem label="产品名称" value={product.name} />
            <InfoItem label="英文名称" value={product.name_en || "-"} />
            <InfoItem label="OEM号" value={<span className="font-mono">{product.oem_number || "-"}</span>} />
            <InfoItem label="分类" value={product.category_name || "-"} />
            <InfoItem label="品牌" value={product.brand || "-"} />
            <InfoItem label="单位" value={product.unit} />
            <InfoItem label="重量" value={product.weight_kg ? `${product.weight_kg} kg` : "-"} />
            <InfoItem label="包装尺寸" value={(product.package_length_cm || product.package_width_cm || product.package_height_cm) ? `${product.package_length_cm || 0} × ${product.package_width_cm || 0} × ${product.package_height_cm || 0} cm` : "-"} />
            <InfoItem label="状态" value={<StatusBadge status={product.status} />} />
            <InfoItem label="适用车型" value={<div className="flex flex-wrap gap-1">{(product.applicable_models || []).map((m, i) => <span key={i} className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">{m}</span>)}</div>} />
            {product.description && <InfoItem label="产品描述" full value={<span className="text-xs">{product.description}</span>} />}
          </div>
        </InfoCard>

        <div className="space-y-4">
          <InfoCard title="价格信息">
            <div className="space-y-3">
              <div className="bg-orange-50 rounded-md p-3"><div className="text-xs text-gray-600">成本价</div><div className="text-xl font-bold text-orange-600 mt-1">{formatCurrency(product.cost_price, "CNY")}</div></div>
              <div className="bg-blue-50 rounded-md p-3"><div className="text-xs text-gray-600">销售价</div><div className="text-xl font-bold text-[#38BDF8] mt-1">{formatCurrency(product.sale_price, "USD")}</div></div>
              <div className="bg-green-50 rounded-md p-3"><div className="text-xs text-gray-600">毛利率</div><div className="text-xl font-bold text-green-600 mt-1">{(((product.sale_price * 7.25 - product.cost_price) / (product.sale_price * 7.25)) * 100).toFixed(1)}%</div></div>
            </div>
          </InfoCard>

          {stock && (
            <InfoCard title="库存信息" icon={Layers}>
              <div className="space-y-2">
                <div className="flex justify-between text-sm"><span className="text-gray-500">当前库存</span><span className="font-medium">{stock.quantity} {product.unit}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">冻结数量</span><span className="font-medium text-orange-600">{stock.frozen_quantity} {product.unit}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">可用数量</span><span className="font-medium text-green-600">{stock.available_quantity} {product.unit}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">所在仓库</span><span className="font-medium">{stock.warehouse_name}</span></div>
              </div>
            </InfoCard>
          )}
        </div>
      </div>

      <InfoCard title="最近出入库记录" icon={Layers}>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {movements.length === 0 ? <div className="text-center py-8 text-sm text-gray-500">暂无出入库记录</div> : movements.map((m) => (
            <div key={m.id} className="flex items-center justify-between p-2.5 rounded border border-gray-100 hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${m.quantity >= 0 ? "bg-green-500" : "bg-red-500"}`} />
                <div>
                  <div className="text-sm font-medium">{m.notes || m.movement_type}</div>
                  <div className="text-xs text-gray-500">{formatDate(m.created_at, "YYYY-MM-DD HH:mm")} · {m.warehouse_name}</div>
                </div>
              </div>
              <div className={`text-sm font-medium ${m.quantity >= 0 ? "text-green-600" : "text-red-600"}`}>{m.quantity >= 0 ? "+" : ""}{m.quantity} {product.unit}</div>
            </div>
          ))}
        </div>
      </InfoCard>
    </div>
  );
}
