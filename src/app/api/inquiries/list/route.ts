import { NextResponse } from "next/server";

const SUPABASE_URL = "https://odmshppyeeaqgurztpfy.supabase.co";
const SUPABASE_KEY = "sb_publishable_uMcpiqTcs3HUbcZu5asyVw_k_bes_1b";

export async function GET() {
  try {
    const res = await fetch(SUPABASE_URL + "/rest/v1/inquiries?select=*,customer:customers(id,name,country)&order=created_at.desc&limit=50", {
      headers: { apikey: SUPABASE_KEY, Authorization: "Bearer " + SUPABASE_KEY },
    });
    const data = await res.json();
    // 展平customer数据
    const result = (data || []).map((item: any) => ({
      ...item,
      customer_name: item.customer?.name,
      customer_country: item.customer?.country,
    }));
    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
