// 订单API
import { supabase } from "@/lib/supabase/client";
import type { Order } from "@/lib/types";

function check() { if (!supabase) throw new Error("Supabase未配置"); return supabase; }

export async function createOrder(input: any): Promise<Order> {
  const client = check();
  const year = new Date().getFullYear();
  const { count } = await client.from("orders").select("*", { count: "exact", head: true }).like("code", `OD-${year}-%`);
  const code = `OD-${year}-${String((count ?? 0) + 1).padStart(4, "0")}`;
  
  const deliveryDate = new Date(); deliveryDate.setDate(deliveryDate.getDate() + 60);
  const totalAmount = (input.items || []).reduce((sum: number, it: any) => sum + (Number(it.quantity) * Number(it.unit_price || 0)), 0);
  
  const { data: order } = await client.from("orders").insert({
    code, customer_id: input.customer_id, quotation_id: input.quotation_id || null,
    order_date: new Date().toISOString().split("T")[0],
    delivery_date: deliveryDate.toISOString().split("T")[0],
    currency: input.currency || "USD", total_amount: totalAmount,
    status: "pending", trade_terms: input.trade_terms || "FOB",
    payment_terms: input.payment_terms || "T/T",
  }).select().single();
  
  if (input.items?.length > 0 && order) {
    const items = input.items.map((it: any) => ({
      order_id: order.id, product_id: it.product_id,
      quantity: it.quantity, unit: it.unit || "个", unit_price: it.unit_price || 0,
    }));
    await client.from("order_items").insert(items);
  }
  return order as Order;
}
