import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

type Category = Database["public"]["Enums"]["product_category"];
type Plan = Database["public"]["Enums"]["store_plan"];

export const PLAN_LIMITS: Record<Plan, number> = { starter: 20, heritage: 100 };

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "store"
  );
}

export const getMyStore = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("stores")
      .select("*")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

export const saveMyStore = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      name: string;
      tagline?: string;
      story?: string;
      region?: string;
      logo_url?: string;
      plan?: Plan;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const existing = await supabase
      .from("stores")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    const payload = {
      name: data.name.trim(),
      tagline: data.tagline?.trim() || null,
      story: data.story?.trim() || null,
      region: data.region?.trim() || null,
      logo_url: data.logo_url?.trim() || null,
      ...(data.plan ? { plan: data.plan } : {}),
    };

    if (existing.data) {
      const { data: row, error } = await supabase
        .from("stores")
        .update(payload)
        .eq("id", existing.data.id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return row;
    }

    const slug = `${slugify(data.name)}-${Math.random().toString(36).slice(2, 6)}`;
    const { data: row, error } = await supabase
      .from("stores")
      .insert({ ...payload, slug, user_id: userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const getMyProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("products")
      .select("*, stores!inner(user_id)")
      .eq("stores.user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const saveProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      id?: string;
      title: string;
      category: Category;
      description?: string;
      price_cents: number;
      stock: number;
      image_url?: string;
      is_published: boolean;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: store, error: storeError } = await supabase
      .from("stores")
      .select("id, plan")
      .eq("user_id", userId)
      .maybeSingle();
    if (storeError) throw new Error(storeError.message);
    if (!store) throw new Error("Create your store first.");

    const payload = {
      title: data.title.trim(),
      category: data.category,
      description: data.description?.trim() || null,
      price_cents: Math.max(0, Math.round(data.price_cents)),
      stock: Math.max(0, Math.round(data.stock)),
      image_url: data.image_url?.trim() || null,
      is_published: data.is_published,
    };

    if (data.id) {
      const { data: row, error } = await supabase
        .from("products")
        .update(payload)
        .eq("id", data.id)
        .eq("store_id", store.id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return row;
    }

    const { count, error: countError } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("store_id", store.id);
    if (countError) throw new Error(countError.message);

    const limit = PLAN_LIMITS[store.plan];
    if ((count ?? 0) >= limit) {
      throw new Error(
        `Your ${store.plan} plan allows ${limit} products. Upgrade to add more.`,
      );
    }

    const slug = `${slugify(data.title)}-${Math.random().toString(36).slice(2, 6)}`;
    const { data: row, error } = await supabase
      .from("products")
      .insert({ ...payload, slug, store_id: store.id })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("products").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getMyOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("orders")
      .select("*, products(title), stores!inner(user_id)")
      .eq("stores.user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const setOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: { id: string; status: Database["public"]["Enums"]["order_status"] }) => input,
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("orders")
      .update({
        status: data.status,
        paid_at: data.status === "paid" ? new Date().toISOString() : null,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
