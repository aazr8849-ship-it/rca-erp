"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Warehouse, ArrowDownToLine, ArrowUpFromLine, Snowflake, Settings2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/common/page-header";
import { FilterBar } from "@/components/common/filter-bar";
import { SearchInput } from "@/components/common/search-input";
import { GenericDataTable, type Column } from "@/components/common/data-table";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Inventory, StockMovement } from "@/lib/types";
import { formatDate, MOVEMENT_TYPE_LABELS, cn } from "@/lib/utils";
import { toast } from "sonner";

export default function InventoryPage() {
  const { inventory, stockMovements, addAuditLog } = useStore();
  const [tab, setTab] = useState("stock");
  const [search, setSearch] = useState("");
  const [freezeTarget, setFreezeTarget] = useState<Inventory | null>(null);
  const [adjustTarget, setAdjustTarget] = useState<Inventory | null>(null);
  const [operation, setOperation] = useState<"freeze" | "unfreeze">("freeze");
  const [quantity, setQuantity] = useState(0);
  const [reason, setReason] = useState("__all__");

  const filteredInventory = useMemo(() => {
    let list = [...inventory];
    if (search) { const q = search.toLowerCase(); list = list.filter((i) => (i.product_name || "").toLowerCase().includes(q) || (i.product_code || "").toLowerCase().includes(q)); }
    return list;
  }, [inventory, search]);

  const inboundMovements = stockMovements.filter((m) => m.movement_type.startsWith("inbound") || m.movement_type === "return_in");
  const outboundMovements = stockMovements.filter((m) => m.movement_type.startsWith("outbound") || m.movement_type === "return_out");

  const stockColumns: Column<Inventory>[] = [
    { key: "product_code", header: "产品编码", width: "100px", render: (r) => <span className="text-xs font-mono">{r.product_code}</span> },
    { key: "product_name", header: "产品名称", render: (r) => <span className="text-sm">{r.product_name}</span> },
    { key: "warehouse_name", header: "仓库", width: "120px" },
    { key: "quantity", header: "库存数量", width: "100px", align: "right", render: (r) => <span className="text-sm font-medium">{r.quantity}</span> },
    { key: "frozen_quantity", header: "冻结", width: "100px", align: "right", render: (r) => <span className={cn("text-sm", r.frozen_quantity > 0 ? "text-orange-600 font-medium" : "text-gray-400")}>{r.frozen_quantity}</span> },
    { key: "available_quantity", header: "可用", width: "100px", align: "right", render: (r) => <span className={cn("text-sm font-medium", r.available_quantity < 50 ? "text-red-600" : "text-green-600")}>{r.available_quantity}</span> },
    { key: "updated_at", header: "更新时间", width: "120px", render: (r) => <span className="text-xs text-gray-500">{formatDate(r.updated_at)}</span> },
    { key: "actions", header: "操作", width: "240px", align: "center", render: (r) => (
      <div className="flex items-center justify-center gap-1">
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setFreezeTarget(r); setOperation("freeze"); setQuantity(0); }}><Snowflake className="h-3 w-3 mr-0.5" />冻结</Button>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setFreezeTarget(r); setOperation("unfreeze"); setQuantity(0); }}>解冻</Button>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setAdjustTarget(r); setQuantity(r.quantity); setReason(""); }}><Settings2 className="h-3 w-3 mr-0.5" />调整</Button>
      </div>
    ) },
  ];

  const movementColumns: Column<StockMovement>[] = [
    { key: "movement_type", header: "类型", width: "120px", render: (r) => <StatusBadge status={r.movement_type} customLabel={MOVEMENT_TYPE_LABELS[r.movement_type]} /> },
    { key: "product_name", header: "产品", render: (r) => <span className="text-sm">{r.product_name}</span> },
    { key: "warehouse_name", header: "仓库", width: "100px" },
    { key: "quantity", header: "数量", width: "100px", align: "right", render: (r) => <span className={cn("text-sm font-medium", r.quantity >= 0 ? "text-green-600" : "text-red-600")}>{r.quantity >= 0 ? "+" : ""}{r.quantity}</span> },
    { key: "notes", header: "备注", render: (r) => <span className="text-xs text-gray-500">{r.notes || "-"}</span> },
    { key: "created_at", header: "时间", width: "150px", render: (r) => <span className="text-xs text-gray-500">{formatDate(r.created_at, "YYYY-MM-DD HH:mm")}</span> },
  ];

  const handleFreezeSubmit = () => {
    if (!freezeTarget) return;
    const now = new Date().toISOString();
    const delta = operation === "freeze" ? quantity : -quantity;
    useStore.setState((state) => ({
      inventory: state.inventory.map((inv) => inv.id === freezeTarget.id ? { ...inv, frozen_quantity: Math.max(0, inv.frozen_quantity + delta), available_quantity: inv.available_quantity - delta, updated_at: now } : inv),
      stockMovements: [{ id: crypto.randomUUID(), movement_type: operation as any, product_id: freezeTarget.product_id, product_name: freezeTarget.product_name, warehouse_id: freezeTarget.warehouse_id, warehouse_name: freezeTarget.warehouse_name, quantity: delta, reference_type: "manual", notes: `手动${operation === "freeze" ? "冻结" : "解冻"}`, created_at: now }, ...state.stockMovements],
    }));
    addAuditLog({ user_id: "u-admin", user_name: "管理员", module: "inventory", action: "update", record_id: freezeTarget.id, after_data: { operation, quantity }, description: `${operation === "freeze" ? "冻结" : "解冻"}库存 ${freezeTarget.product_name} ${quantity}件` });
    toast.success(`${operation === "freeze" ? "冻结" : "解冻"}成功`);
    setFreezeTarget(null);
  };

  const handleAdjustSubmit = () => {
    if (!adjustTarget) return;
    const now = new Date().toISOString();
    const diff = quantity - adjustTarget.quantity;
    useStore.setState((state) => ({
      inventory: state.inventory.map((inv) => inv.id === adjustTarget.id ? { ...inv, quantity, available_quantity: inv.available_quantity + diff, updated_at: now } : inv),
      stockMovements: [{ id: crypto.randomUUID(), movement_type: diff > 0 ? "inbound_adjust_gain" : "outbound_adjust_loss", product_id: adjustTarget.product_id, product_name: adjustTarget.product_name, warehouse_id: adjustTarget.warehouse_id, warehouse_name: adjustTarget.warehouse_name, quantity: diff, before_quantity: adjustTarget.quantity, after_quantity: quantity, notes: reason || `盘点${diff > 0 ? "盘盈" : "盘亏"}`, created_at: now }, ...state.stockMovements],
    }));
    addAuditLog({ user_id: "u-admin", user_name: "管理员", module: "inventory", action: "update", record_id: adjustTarget.id, before_data: { quantity: adjustTarget.quantity }, after_data: { quantity, reason }, description: `库存调整：${adjustTarget.quantity} → ${quantity}（${diff > 0 ? "盘盈" : "盘亏"}${Math.abs(diff)}）` });
    toast.success("调整成功");
    setAdjustTarget(null);
  };

  return (
    <div>
      <PageHeader title="库存管理" description="库存查询、出入库流水、库存调整" actions={
        <ActionButton icon="export" onClick={async () => {
          const { exportToExcel } = await import("@/lib/excel-utils");
          const exportData = tab === "stock" ? filteredInventory : (tab === "inbound" ? inboundMovements : outboundMovements);
          const fileName = tab === "stock" ? "库存查询" : (tab === "inbound" ? "入库记录" : "出库记录");
          if (tab === "stock") {
            exportToExcel(exportData, fileName, "库存", [
              { key: "product_code", label: "产品编码" },
              { key: "product_name", label: "产品名称" },
              { key: "warehouse_name", label: "仓库" },
              { key: "quantity", label: "库存数量" },
              { key: "frozen_quantity", label: "冻结数量" },
              { key: "available_quantity", label: "可用数量" },
              { key: "updated_at", label: "更新时间" },
            ]);
          } else {
            exportToExcel(exportData, fileName, tab === "inbound" ? "入库" : "出库", [
              { key: "movement_type", label: "类型" },
              { key: "product_name", label: "产品" },
              { key: "warehouse_name", label: "仓库" },
              { key: "quantity", label: "数量" },
              { key: "notes", label: "备注" },
              { key: "created_at", label: "时间" },
            ]);
          }
        }}>导出Excel</ActionButton>
      } />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="stock"><Warehouse className="h-3.5 w-3.5 mr-1.5" />库存查询 ({inventory.length})</TabsTrigger>
          <TabsTrigger value="inbound"><ArrowDownToLine className="h-3.5 w-3.5 mr-1.5" />入库管理 ({inboundMovements.length})</TabsTrigger>
          <TabsTrigger value="outbound"><ArrowUpFromLine className="h-3.5 w-3.5 mr-1.5" />出库管理 ({outboundMovements.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="stock" className="mt-3">
          <FilterBar onReset={() => setSearch("")}><SearchInput value={search} onChange={setSearch} placeholder="搜索产品..." className="w-64" /></FilterBar>
          <GenericDataTable data={filteredInventory} columns={stockColumns} rowKey={(r) => r.id} emptyTitle="暂无库存" />
        </TabsContent>
        <TabsContent value="inbound" className="mt-3"><GenericDataTable data={inboundMovements} columns={movementColumns} rowKey={(r) => r.id} emptyTitle="暂无入库记录" /></TabsContent>
        <TabsContent value="outbound" className="mt-3"><GenericDataTable data={outboundMovements} columns={movementColumns} rowKey={(r) => r.id} emptyTitle="暂无出库记录" /></TabsContent>
      </Tabs>

      <Dialog open={!!freezeTarget} onOpenChange={(o) => !o && setFreezeTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{operation === "freeze" ? "冻结库存" : "解冻库存"}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><div className="text-xs text-gray-500">产品</div><div className="text-sm font-medium">{freezeTarget?.product_name}</div></div>
            <div className="grid grid-cols-2 gap-4">
              <div><div className="text-xs text-gray-500">当前冻结</div><div className="text-sm font-medium">{freezeTarget?.frozen_quantity}</div></div>
              <div><div className="text-xs text-gray-500">可用数量</div><div className="text-sm font-medium">{freezeTarget?.available_quantity}</div></div>
            </div>
            <div className="space-y-1.5"><Label className="text-xs">{operation === "freeze" ? "冻结数量" : "解冻数量"}</Label><Input type="number" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} min={0} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setFreezeTarget(null)}>取消</Button><Button onClick={handleFreezeSubmit} className="bg-[#38BDF8] hover:bg-[#0EA5E9]">确认</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!adjustTarget} onOpenChange={(o) => !o && setAdjustTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>库存调整（盘点）</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><div className="text-xs text-gray-500">产品</div><div className="text-sm font-medium">{adjustTarget?.product_name}</div></div>
            <div className="grid grid-cols-2 gap-4">
              <div><div className="text-xs text-gray-500">账面库存</div><div className="text-sm font-medium">{adjustTarget?.quantity}</div></div>
              <div><div className="text-xs text-gray-500">差异</div><div className="text-sm font-medium text-orange-600">{quantity - (adjustTarget?.quantity || 0)}</div></div>
            </div>
            <div className="space-y-1.5"><Label className="text-xs">实际数量</Label><Input type="number" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} min={0} /></div>
            <div className="space-y-1.5"><Label className="text-xs">调整原因</Label><Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder="如：定期盘点、损坏报损等" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setAdjustTarget(null)}>取消</Button><Button onClick={handleAdjustSubmit} className="bg-[#38BDF8] hover:bg-[#0EA5E9]">确认调整</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
