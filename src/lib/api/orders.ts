// orders API
const SUPABASE_URL = "https://odmshppyeeaqgurztpfy.supabase.co";
const SUPABASE_KEY = "sb_publishable_uMcpiqTcs3HUbcZu5asyVw_k_bes_1b";

async function supabaseRequest(path: string, method: string, body?: any) {
  const res = await fetch(SUPABASE_URL + path, {
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

export async function createOrder(input: any): Promise<any> {
  const year = new Date().getFullYear();
  const countRes = await supabaseRequest("/rest/v1/orders?select=id&code=like.OD-"+year+"-%25", "GET");
  const seq = String((countRes?.length || 0) + 1).padStart(4, "0");
  const code = `OD-${year}-${seq}`;
  const deliveryDate = new Date(); deliveryDate.setDate(deliveryDate.getDate() + 60);
  const totalAmount = (input.items || []).reduce((sum: number, it: any) => sum + (Number(it.quantity) * Number(it.unit_price || 0)), 0);
  
  const [order] = await supabaseRequest(`/rest/v1/orders`, "POST", {
    code, customer_id: input.customer_id,
    order_date: new Date().toISOString().split("T")[0],
    delivery_date: deliveryDate.toISOString().split("T")[0],
    currency: input.currency || "USD", total_amount: totalAmount,
    status: "pending", trade_terms: input.trade_terms || "FOB",
    payment_terms: input.payment_terms || "T/T",
  });
  
  if (input.items?.length > 0 && order) {
    const items = input.items.filter((it: any) => it.product_id).map((it: any) => ({
      order_id: order.id, product_id: it.product_id,
      quantity: it.quantity, unit: it.unit || "个", unit_price: it.unit_price || 0,
    }));
    if (items.length > 0) await supabaseRequest(`/rest/v1/order_items`, "POST", items);
  }
  return order;
}
