// ============================================================
// Supabase 数据访问层 - 客户管理
// ============================================================
import { supabase } from "@/lib/supabase/client";
import type { Customer } from "@/lib/types";

/** 检查 Supabase 是否可用 */
function checkSupabase() {
  if (!supabase) {
    throw new Error("Supabase 未配置，请检查环境变量");
  }
  return supabase;
}

export async function fetchCustomers(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  level?: string;
  status?: string;
  country?: string;
} = {}): Promise<{ data: Customer[]; total: number }> {
  const client = checkSupabase();
  const { page = 1, pageSize = 20, search, level, status, country } = params;
  const start = (page - 1) * pageSize;
  const end = start + pageSize - 1;

  let query = client
    .from("customers")
    .select("*", { count: "exact" })
    .is("deleted_at", null);

  if (search) {
    query = query.or(
      `name.ilike.%${search}%,code.ilike.%${search}%,contact_person.ilike.%${search}%`,
    );
  }
  if (level && level !== "__all__") query = query.eq("level", level);
  if (status && status !== "__all__") query = query.eq("status", status);
  if (country) query = query.ilike("country", `%${country}%`);

  query = query.order("created_at", { ascending: false }).range(start, end);

  const { data, count, error } = await query;
  if (error) throw new Error(error.message);
  return { data: (data as Customer[]) || [], total: count || 0 };
}

export async function fetchCustomerById(id: string): Promise<Customer | null> {
  const client = checkSupabase();
  const { data, error } = await client
    .from("customers")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .single();
  if (error) throw new Error(error.message);
  return data as Customer;
}

export async function createCustomer(
  input: Partial<Customer>,
): Promise<Customer> {
  const client = checkSupabase();
  const code = await generateSupabaseCode("customers", "CU");
  const { data, error } = await client
    .from("customers")
    .insert({ ...input, code })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Customer;
}

export async function updateCustomer(
  id: string,
  input: Partial<Customer>,
): Promise<Customer> {
  const client = checkSupabase();
  const { data, error } = await client
    .from("customers")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Customer;
}

export async function deleteCustomer(id: string): Promise<void> {
  const client = checkSupabase();
  const { error } = await client
    .from("customers")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function generateSupabaseCode(
  table: string,
  prefix: string,
): Promise<string> {
  const client = checkSupabase();
  const today = new Date();
  const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;
  const pattern = `${prefix}${dateStr}%`;

  const { count, error } = await client
    .from(table)
    .select("*", { count: "exact", head: true })
    .like("code", pattern);

  if (error) throw new Error(error.message);
  const seq = String((count ?? 0) + 1).padStart(4, "0");
  return `${prefix}${dateStr}${seq}`;
}
