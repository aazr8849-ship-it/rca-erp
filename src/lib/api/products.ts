// ============================================================
// Supabase 数据访问层 - 产品管理（含图片上传到Storage）
// ============================================================
import { supabase } from "@/lib/supabase/client";
import type { Product } from "@/lib/types";

function checkSupabase() {
  if (!supabase) {
    throw new Error("Supabase 未配置，请检查环境变量");
  }
  return supabase;
}

export async function fetchProducts(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  exactMatch?: boolean;
  categoryId?: string;
  status?: string;
} = {}): Promise<{ data: Product[]; total: number }> {
  const client = checkSupabase();
  const { page = 1, pageSize = 20, search, exactMatch, categoryId, status } = params;
  const start = (page - 1) * pageSize;
  const end = start + pageSize - 1;

  let query = client
    .from("products")
    .select("*", { count: "exact" })
    .is("deleted_at", null);

  if (search) {
    if (exactMatch) {
      query = query.eq("oem_number", search);
    } else {
      query = query.or(
        `name.ilike.%${search}%,code.ilike.%${search}%,oem_number.ilike.%${search}%`,
      );
    }
  }
  if (categoryId && categoryId !== "__all__") query = query.eq("category_id", categoryId);
  if (status && status !== "__all__") query = query.eq("status", status);

  query = query.order("created_at", { ascending: false }).range(start, end);

  const { data, count, error } = await query;
  if (error) throw new Error(error.message);
  return { data: (data as Product[]) || [], total: count || 0 };
}

export async function fetchProductById(id: string): Promise<Product | null> {
  const client = checkSupabase();
  const { data, error } = await client
    .from("products")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .single();
  if (error) throw new Error(error.message);
  return data as Product;
}

export async function createProduct(input: Partial<Product>): Promise<Product> {
  const client = checkSupabase();
  const code = await generateSupabaseCode("products", "PD");
  const { data, error } = await client
    .from("products")
    .insert({ ...input, code })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Product;
}

export async function updateProduct(id: string, input: Partial<Product>): Promise<Product> {
  const client = checkSupabase();
  const { data, error } = await client
    .from("products")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Product;
}

export async function deleteProduct(id: string): Promise<void> {
  const client = checkSupabase();
  const { error } = await client
    .from("products")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

// ====== 图片上传到 Supabase Storage ======

export async function uploadProductImage(
  productId: string,
  file: File,
): Promise<string> {
  const client = checkSupabase();
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const fileName = `${productId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error: uploadError } = await client.storage
    .from("product-images")
    .upload(fileName, file);

  if (uploadError) throw new Error(uploadError.message);

  const { data: urlData } = client.storage.from("product-images").getPublicUrl(fileName);
  return urlData.publicUrl;
}

export async function addProductImage(productId: string, imageUrl: string): Promise<void> {
  const client = checkSupabase();
  // 先获取当前 image_urls
  const { data: product, error: fetchError } = await client
    .from("products")
    .select("image_urls")
    .eq("id", productId)
    .single();

  if (fetchError) throw new Error(fetchError.message);

  const currentUrls = (product as any)?.image_urls || [];
  const newUrls = [...currentUrls, imageUrl];

  const { error: updateError } = await client
    .from("products")
    .update({ image_urls: newUrls, updated_at: new Date().toISOString() })
    .eq("id", productId);

  if (updateError) throw new Error(updateError.message);
}

export async function removeProductImage(productId: string, index: number): Promise<void> {
  const client = checkSupabase();
  const { data: product, error: fetchError } = await client
    .from("products")
    .select("image_urls")
    .eq("id", productId)
    .single();

  if (fetchError) throw new Error(fetchError.message);

  const currentUrls: string[] = (product as any)?.image_urls || [];
  const urlToRemove = currentUrls[index];
  if (!urlToRemove) return;

  // 从Storage删除（如果是Supabase URL）
  if (urlToRemove.includes("supabase.co")) {
    const path = urlToRemove.split("/product-images/")[1];
    if (path) {
      await client.storage.from("product-images").remove([path]);
    }
  }

  // 从数组中移除
  const newUrls = currentUrls.filter((_, i) => i !== index);
  const { error: updateError } = await client
    .from("products")
    .update({ image_urls: newUrls, updated_at: new Date().toISOString() })
    .eq("id", productId);

  if (updateError) throw new Error(updateError.message);
}

// ====== 产品分类 ======

export async function fetchCategories(): Promise<any[]> {
  const client = checkSupabase();
  const { data, error } = await client
    .from("product_categories")
    .select("*")
    .order("sort_order");
  if (error) throw new Error(error.message);
  return data || [];
}

// ====== 通用编码生成 ======

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
