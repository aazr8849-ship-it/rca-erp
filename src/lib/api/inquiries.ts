// 询盘API
import { supabase } from "@/lib/supabase/client";
import type { Inquiry } from "@/lib/types";

function check() { if (!supabase) throw new Error("Supabase未配置"); return supabase; }

export async function createInquiry(input: any): Promise<Inquiry> {
  const client = check();
  const today = new Date();
  const year = today.getFullYear();
  const pattern = `IN-${year}-%`;
  const { count } = await client.from("inquiries").select("*", { count: "exact", head: true }).like("code", pattern);
  const code = `IN-${year}-${String((count ?? 0) + 1).padStart(4, "0")}`;
  
  const { data: inquiry } = await client.from("inquiries").insert({
    code, customer_id: input.customer_id, subject: input.subject || "新询盘",
    source: input.source || "email", priority: input.priority || "medium",
    status: "pending", notes: input.notes || "",
  }).select().single();
  
  // 插入明细
  if (input.items?.length > 0 && inquiry) {
    const items = input.items.map((it: any) => ({
      inquiry_id: inquiry.id, product_id: it.product_id,
      quantity: it.quantity, unit: it.unit || "个", target_price: it.target_price, notes: it.notes,
    }));
    await client.from("inquiry_items").insert(items);
  }
  return inquiry as Inquiry;
}
