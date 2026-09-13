// shipments API
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

export async function createShipment(input: any): Promise<any> {
  const year = new Date().getFullYear();
  const countRes = await supabaseRequest(`/rest/v1/shipments?select=id&code=like.SH-${year}-%`, "GET");
  const seq = String((countRes?.length || 0) + 1).padStart(4, "0");
  const code = `SH-${year}-${seq}`;
  
  const [shipment] = await supabaseRequest(`/rest/v1/shipments`, "POST", {
    code, order_id: input.order_id,
    shipment_date: new Date().toISOString().split("T")[0],
    shipping_method: input.shipping_method || "land",
    tracking_number: input.tracking_number || "",
    container_number: input.container_number || "",
    bl_number: input.bl_number || "",
    total_weight: input.total_weight || null,
    total_cartons: input.total_cartons || null,
    status: "draft",
  });
  return shipment;
}
