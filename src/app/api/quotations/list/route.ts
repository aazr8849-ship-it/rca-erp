import { NextResponse } from "next/server";

const SUPABASE_URL = "https://odmshppyeeaqgurztpfy.supabase.co";
const SUPABASE_KEY = "sb_publishable_uMcpiqTcs3HUbcZu5asyVw_k_bes_1b";

export async function GET() {
  try {
    const res = await fetch(SUPABASE_URL + "/rest/v1/quotations?select=*&order=created_at.desc&limit=50", {
      headers: { apikey: SUPABASE_KEY, Authorization: "Bearer " + SUPABASE_KEY },
    });
    const data = await res.json();
    return NextResponse.json({ data: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
