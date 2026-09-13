// 询盘API - 直接用fetch避免环境变量问题
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

export async function createInquiry(input: any): Promise<any> {
  const year = new Date().getFullYear();
  
  // 获取当前序号
  const existing = await supabaseFetch("inquiries", "GET", null, `?select=code&code=like.IN-${year}-%`);
  const seq = String((existing?.length || 0) + 1).padStart(4, "0");
  const code = `IN-${year}-${seq}`;
  
  // 创建询盘
  const [inquiry] = await supabaseFetch("inquiries", "POST", {
    code, customer_id: input.customer_id, subject: input.subject || "新询盘",
    source: input.source || "email", priority: input.priority || "medium",
    status: "pending", notes: input.notes || "",
  });
  
  // 创建明细
  if (input.items?.length > 0 && inquiry) {
    const items = input.items.filter((it: any) => it.product_id).map((it: any) => ({
      inquiry_id: inquiry.id, product_id: it.product_id,
      quantity: it.quantity, unit: it.unit || "个", target_price: it.target_price || null,
    }));
    if (items.length > 0) {
      await supabaseFetch("inquiry_items", "POST", items);
    }
  }
  return inquiry;
}
