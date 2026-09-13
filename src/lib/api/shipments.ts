// 发货API
import { supabase } from "@/lib/supabase/client";
import type { Shipment } from "@/lib/types";

function check() { if (!supabase) throw new Error("Supabase未配置"); return supabase; }

export async function createShipment(input: any): Promise<Shipment> {
  const client = check();
  const year = new Date().getFullYear();
  const { count } = await client.from("shipments").select("*", { count: "exact", head: true }).like("code", `SH-${year}-%`);
  const code = `SH-${year}-${String((count ?? 0) + 1).padStart(4, "0")}`;
  
  const { data: shipment } = await client.from("shipments").insert({
    code, order_id: input.order_id,
    shipment_date: new Date().toISOString().split("T")[0],
    shipping_method: input.shipping_method || "land",
    tracking_number: input.tracking_number || "",
    container_number: input.container_number || "",
    bl_number: input.bl_number || "",
    total_weight: input.total_weight || null,
    total_cartons: input.total_cartons || null,
    status: "draft",
  }).select().single();
  
  return shipment as Shipment;
}
