import { NextResponse } from "next/server";

const SUPABASE_URL = "https://odmshppyeeaqgurztpfy.supabase.co";
const SUPABASE_KEY = "sb_publishable_uMcpiqTcs3HUbcZu5asyVw_k_bes_1b";

export async function GET() {
  try {
    const res = await fetch(SUPABASE_URL + "/rest/v1/inventory?select=*,product:products(id,name,code),warehouse:warehouses(id,name)&order=updated_at.desc&limit=50", {
      headers: { apikey: SUPABASE_KEY, Authorization: "Bearer " + SUPABASE_KEY },
    });
    const data = await res.json();
    const result = (data || []).map((item: any) => ({
      ...item,
      product_name: item.product?.name,
      product_code: item.product?.code,
      warehouse_name: item.warehouse?.name,
      available_quantity: item.quantity - item.frozen_quantity,
    }));
    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
