// 询盘API - 直接用fetch
const SUPABASE_URL = "https://odmshppyeeaqgurztpfy.supabase.co";
const SUPABASE_KEY = "sb_publishable_uMcpiqTcs3HUbcZu5asyVw_k_bes_1b";

async function supabaseRequest(path: string, method: string, body?: any) {
  const fullUrl = SUPABASE_URL + path;
  console.log('FETCH URL:', fullUrl);
  try {
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
  console.log('FETCH RES:', res.status);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "请求失败" }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return await res.json();
  } catch(e) {
    console.error('FETCH ERROR:', e.message, fullUrl);
    throw e;
  }
}

export async function createInquiry(input: any): Promise<any> {
  const year = new Date().getFullYear();
  // 获取序号
  const countRes = await supabaseRequest(`/rest/v1/inquiries?select=id&code=like.IN-${year}-%`, "GET");
  const seq = String((countRes?.length || 0) + 1).padStart(4, "0");
  const code = `IN-${year}-${seq}`;
  
  // 创建询盘
  const [inquiry] = await supabaseRequest(`/rest/v1/inquiries`, "POST", {
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
      await supabaseRequest(`/rest/v1/inquiry_items`, "POST", items);
    }
  }
  return inquiry;
}
