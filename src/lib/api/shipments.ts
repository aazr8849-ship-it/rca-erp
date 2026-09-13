// shipments API - 直接用fetch
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

export async function createShipment(input: any): Promise<any> {
  const year = new Date().getFullYear();
  const existing = await supabaseFetch("shipments", "GET", null, `?select=code&code=like.SH-${year}-%`);
  const seq = String((existing?.length || 0) + 1).padStart(4, "0");
  const code = `SH-${year}-${seq}`;
  
  const [shipment] = await supabaseFetch("shipments", "POST", {
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
