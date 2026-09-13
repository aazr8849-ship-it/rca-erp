// quotations API - 直接用fetch
const SUPABASE_URL = "https://odmshppyeeaqgurztpfy.supabase.co";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_uMcpiqTcs3HUbcZu5asyVw_k_bes_1b";

async function supabaseFetch(table: string, method: string, body?: any, query?: string) {
  const url = `${SUPABASE_URL}/rest/v1/${table}${query || ""}`;
  const res = await fetch(url, {
    method,
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": method === "POST" ? "return=representation" : undefined,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "请求失败");
  }
  return await res.json();
}

export async function createQuotation(input: any): Promise<any> {
  const year = new Date().getFullYear();
  const existing = await supabaseFetch("quotations", "GET", null, `?select=code&code=like.QT-${year}-%`);
  const seq = String((existing?.length || 0) + 1).padStart(4, "0");
  const code = `QT-${year}-${seq}`;
  const validUntil = new Date(); validUntil.setDate(validUntil.getDate() + 30);
  const totalAmount = (input.items || []).reduce((sum: number, it: any) => sum + (Number(it.quantity) * Number(it.unit_price || 0)), 0);
  
  const [quotation] = await supabaseFetch("quotations", "POST", {
    code, customer_id: input.customer_id, pricing_status: input.items?.length > 0 ? "priced" : "pending",
    status: "draft", total_amount: totalAmount, currency: input.currency || "USD",
    valid_until: validUntil.toISOString().split("T")[0],
    trade_terms: input.trade_terms || "FOB", payment_terms: input.payment_terms || "T/T",
  });
  
  if (input.items?.length > 0 && quotation) {
    const items = input.items.filter((it: any) => it.product_id).map((it: any) => ({
      quotation_id: quotation.id, product_id: it.product_id,
      quantity: it.quantity, unit: it.unit || "个", unit_price: it.unit_price || 0,
    }));
    if (items.length > 0) await supabaseFetch("quotation_items", "POST", items);
  }
  return quotation;
}
