// 报价API
import { supabase } from "@/lib/supabase/client";
import type { Quotation } from "@/lib/types";

function check() { if (!supabase) throw new Error("Supabase未配置"); return supabase; }

export async function createQuotation(input: any): Promise<Quotation> {
  const client = check();
  const year = new Date().getFullYear();
  const { count } = await client.from("quotations").select("*", { count: "exact", head: true }).like("code", `QT-${year}-%`);
  const code = `QT-${year}-${String((count ?? 0) + 1).padStart(4, "0")}`;
  
  const validUntil = new Date(); validUntil.setDate(validUntil.getDate() + 30);
  const totalAmount = (input.items || []).reduce((sum: number, it: any) => sum + (Number(it.quantity) * Number(it.unit_price || 0)), 0);
  
  const { data: quotation } = await client.from("quotations").insert({
    code, customer_id: input.customer_id, inquiry_id: input.inquiry_id || null,
    pricing_status: input.items?.length > 0 ? "priced" : "pending",
    status: "draft", total_amount: totalAmount, currency: input.currency || "USD",
    valid_until: validUntil.toISOString().split("T")[0],
    trade_terms: input.trade_terms || "FOB", payment_terms: input.payment_terms || "T/T",
  }).select().single();
  
  if (input.items?.length > 0 && quotation) {
    const items = input.items.map((it: any) => ({
      quotation_id: quotation.id, product_id: it.product_id,
      quantity: it.quantity, unit: it.unit || "个", unit_price: it.unit_price || 0,
    }));
    await client.from("quotation_items").insert(items);
  }
  return quotation as Quotation;
}
