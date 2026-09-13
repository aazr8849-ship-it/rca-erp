// 采购API
import { supabase } from "@/lib/supabase/client";
import type { PurchaseOrder } from "@/lib/types";

function check() { if (!supabase) throw new Error("Supabase未配置"); return supabase; }

export async function createPurchaseOrder(input: any): Promise<PurchaseOrder> {
  const client = check();
  const year = new Date().getFullYear();
  const { count } = await client.from("purchase_orders").select("*", { count: "exact", head: true }).like("code", `PO-${year}-%`);
  const code = `PO-${year}-${String((count ?? 0) + 1).padStart(4, "0")}`;
  
  const totalAmount = (input.items || []).reduce((sum: number, it: any) => sum + (Number(it.quantity) * Number(it.unit_price || 0)), 0);
  
  const { data: po } = await client.from("purchase_orders").insert({
    code, supplier_id: input.supplier_id,
    order_date: new Date().toISOString().split("T")[0],
    currency: input.currency || "CNY", total_amount: totalAmount,
    status: "pending", trade_terms: input.trade_terms || "EXW",
    payment_terms: input.payment_terms || "T/T 30天",
  }).select().single();
  
  if (input.items?.length > 0 && po) {
    const items = input.items.map((it: any) => ({
      purchase_order_id: po.id, product_id: it.product_id,
      quantity: it.quantity, unit: it.unit || "个", unit_price: it.unit_price || 0,
    }));
    await client.from("purchase_order_items").insert(items);
  }
  return po as PurchaseOrder;
}
