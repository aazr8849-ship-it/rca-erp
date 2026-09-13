// purchases API
const SUPABASE_URL = "https://odmshppyeeaqgurztpfy.supabase.co";
const SUPABASE_KEY = "sb_publishable_uMcpiqTcs3HUbcZu5asyVw_k_bes_1b";

async function supabaseRequest(path: string, method: string, body?: any) {
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    method,
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": method === "POST" ? "return=representation" : "count=exact",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "请求失败" }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return await res.json();
}

export async function createPurchaseOrder(input: any): Promise<any> {
  const year = new Date().getFullYear();
  const countRes = await supabaseRequest(`/rest/v1/purchase_orders?select=id&code=like.PO-${year}-%`, "GET");
  const seq = String((countRes?.length || 0) + 1).padStart(4, "0");
  const code = `PO-${year}-${seq}`;
  const totalAmount = (input.items || []).reduce((sum: number, it: any) => sum + (Number(it.quantity) * Number(it.unit_price || 0)), 0);
  
  const [po] = await supabaseRequest(`/rest/v1/purchase_orders`, "POST", {
    code, supplier_id: input.supplier_id,
    order_date: new Date().toISOString().split("T")[0],
    currency: input.currency || "CNY", total_amount: totalAmount,
    status: "pending", trade_terms: input.trade_terms || "EXW",
    payment_terms: input.payment_terms || "T/T 30天",
  });
  
  if (input.items?.length > 0 && po) {
    const items = input.items.filter((it: any) => it.product_id).map((it: any) => ({
      purchase_order_id: po.id, product_id: it.product_id,
      quantity: it.quantity, unit: it.unit || "个", unit_price: it.unit_price || 0,
    }));
    if (items.length > 0) await supabaseRequest(`/rest/v1/purchase_order_items`, "POST", items);
  }
  return po;
}
