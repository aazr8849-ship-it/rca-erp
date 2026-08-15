// ============================================================
// Supabase 数据访问层 - 供应商管理
// ============================================================
import { supabase } from "@/lib/supabase/client";
import type { Supplier } from "@/lib/types";

function checkSupabase() {
  if (!supabase) throw new Error("Supabase 未配置");
  return supabase;
}

export async function fetchSuppliers(params: {
  page?: number; pageSize?: number; search?: string; level?: string; status?: string;
} = {}): Promise<{ data: Supplier[]; total: number }> {
  const client = checkSupabase();
  const { page = 1, pageSize = 20, search, level, status } = params;
  const start = (page - 1) * pageSize;
  const end = start + pageSize - 1;

  let query = client.from("suppliers").select("*", { count: "exact" }).is("deleted_at", null);
  if (search) {
    query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%,contact_person.ilike.%${search}%`);
  }
  if (level && level !== "__all__") query = query.eq("level", level);
  if (status && status !== "__all__") query = query.eq("status", status);
  query = query.order("created_at", { ascending: false }).range(start, end);

  const { data, count, error } = await query;
  if (error) throw new Error(error.message);
  return { data: (data as Supplier[]) || [], total: count || 0 };
}

export async function fetchSupplierById(id: string): Promise<Supplier | null> {
  const client = checkSupabase();
  const { data, error } = await client
    .from("suppliers")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .single();
  if (error) throw new Error(error.message);
  return data as Supplier;
}

export async function createSupplier(input: Partial<Supplier>): Promise<Supplier> {
  const client = checkSupabase();
  const code = await generateSupplierCode("SU");
  const { data, error } = await client.from("suppliers").insert({ ...input, code }).select().single();
  if (error) throw new Error(error.message);
  return data as Supplier;
}

export async function updateSupplier(id: string, input: Partial<Supplier>): Promise<Supplier> {
  const client = checkSupabase();
  const { data, error } = await client
    .from("suppliers")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Supplier;
}

export async function deleteSupplier(id: string): Promise<void> {
  const client = checkSupabase();
  const { error } = await client
    .from("suppliers")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

async function generateSupplierCode(prefix: string): Promise<string> {
  const client = checkSupabase();
  const today = new Date();
  const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;
  const pattern = `${prefix}${dateStr}%`;
  const { count, error } = await client
    .from("suppliers")
    .select("*", { count: "exact", head: true })
    .like("code", pattern);
  if (error) throw new Error(error.message);
  const seq = String((count ?? 0) + 1).padStart(4, "0");
  return `${prefix}${dateStr}${seq}`;
}
