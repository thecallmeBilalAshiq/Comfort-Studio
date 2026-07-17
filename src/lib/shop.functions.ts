import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

function isNewApiKey(v: string) {
  return v.startsWith("sb_publishable_") || v.startsWith("sb_secret_");
}
function createSupabaseFetch(key: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );
    if (init?.headers) new Headers(init.headers).forEach((v, k) => headers.set(k, v));
    if (isNewApiKey(key) && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
    headers.set("apikey", key);
    return fetch(input, { ...init, headers });
  };
}

function publicClient() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient<Database>(url, key, {
    global: { fetch: createSupabaseFetch(key) },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

export const listCategories = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await publicClient()
    .from("categories")
    .select("*")
    .order("sort_order");
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const listProducts = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z
      .object({ categorySlug: z.string().optional(), featured: z.boolean().optional() })
      .parse(d ?? {}),
  )
  .handler(async ({ data }) => {
    const sb = publicClient();
    let query = sb.from("products").select("*, categories(slug, name)").order("created_at", { ascending: false });
    if (data.featured) query = query.eq("featured", true);
    const { data: products, error } = await query;
    if (error) throw new Error(error.message);
    const filtered = data.categorySlug
      ? (products ?? []).filter((p) => (p.categories as { slug: string } | null)?.slug === data.categorySlug)
      : (products ?? []);
    return filtered;
  });

export const getProductBySlug = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ slug: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: product, error } = await sb
      .from("products")
      .select("*, categories(slug, name)")
      .eq("slug", data.slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return product;
  });

const OrderInput = z.object({
  email: z.string().email(),
  fullName: z.string().min(2),
  phone: z.string().optional().nullable(),
  addressLine1: z.string().min(2),
  addressLine2: z.string().optional().nullable(),
  city: z.string().min(1),
  postcode: z.string().min(2),
  country: z.string().default("GB"),
  notes: z.string().optional().nullable(),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        variant: z.string().optional().nullable(),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
});

export const createOrder = createServerFn({ method: "POST" })
  .inputValidator((d) => OrderInput.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Fetch current product data to compute authoritative pricing
    const ids = data.items.map((i) => i.productId);
    const { data: products, error: pErr } = await supabaseAdmin
      .from("products")
      .select("id, name, slug, price_cents, in_stock")
      .in("id", ids);
    if (pErr) throw new Error(pErr.message);
    if (!products || products.length !== new Set(ids).size) {
      throw new Error("Some items in your cart are no longer available.");
    }

    const productMap = new Map(products.map((p) => [p.id, p]));
    let subtotal = 0;
    const lineItems = data.items.map((i) => {
      const p = productMap.get(i.productId)!;
      if (!p.in_stock) throw new Error(`${p.name} is currently out of stock.`);
      const line = p.price_cents * i.quantity;
      subtotal += line;
      return {
        product_id: p.id,
        product_name: p.name,
        product_slug: p.slug,
        variant_label: i.variant ?? null,
        unit_price_cents: p.price_cents,
        quantity: i.quantity,
        line_total_cents: line,
      };
    });

    const shipping = subtotal >= 100000 ? 0 : 4900; // free over £1000
    const total = subtotal + shipping;

    const { data: order, error: oErr } = await supabaseAdmin
      .from("orders")
      .insert({
        email: data.email,
        full_name: data.fullName,
        phone: data.phone ?? null,
        address_line1: data.addressLine1,
        address_line2: data.addressLine2 ?? null,
        city: data.city,
        postcode: data.postcode,
        country: data.country,
        subtotal_cents: subtotal,
        shipping_cents: shipping,
        total_cents: total,
        currency: "GBP",
        status: "pending",
        notes: data.notes ?? null,
      })
      .select("id")
      .single();
    if (oErr || !order) throw new Error(oErr?.message ?? "Failed to create order");

    const { error: iErr } = await supabaseAdmin
      .from("order_items")
      .insert(lineItems.map((li) => ({ ...li, order_id: order.id })));
    if (iErr) throw new Error(iErr.message);

    return { orderId: order.id, totalCents: total };
  });

export const getOrder = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return order;
  });
