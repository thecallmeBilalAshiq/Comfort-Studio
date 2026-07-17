import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { adminUpsertProduct } from "@/lib/admin.functions";
import { toast } from "sonner";

type Category = { id: string; name: string; slug: string };

type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  short_description: string | null;
  price_cents: number;
  compare_at_price_cents: number | null;
  category_id: string | null;
  primary_image_url: string | null;
  colors: string[];
  materials: string[];
  dimensions: string | null;
  in_stock: boolean;
  featured: boolean;
};

export function ProductForm({ product, categories }: { product?: Product; categories: Category[] }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: product?.name ?? "",
    slug: product?.slug ?? "",
    description: product?.description ?? "",
    short_description: product?.short_description ?? "",
    price: product ? (product.price_cents / 100).toFixed(2) : "",
    compare: product?.compare_at_price_cents ? (product.compare_at_price_cents / 100).toFixed(2) : "",
    category_id: product?.category_id ?? "",
    primary_image_url: product?.primary_image_url ?? "",
    colors: (product?.colors ?? []).join(", "),
    materials: (product?.materials ?? []).join(", "),
    dimensions: product?.dimensions ?? "",
    in_stock: product?.in_stock ?? true,
    featured: product?.featured ?? false,
  });

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await adminUpsertProduct({
        data: {
          id: product?.id,
          name: form.name,
          slug: form.slug,
          description: form.description,
          short_description: form.short_description || null,
          price_cents: Math.round(parseFloat(form.price) * 100),
          compare_at_price_cents: form.compare ? Math.round(parseFloat(form.compare) * 100) : null,
          category_id: form.category_id || null,
          primary_image_url: form.primary_image_url || null,
          colors: form.colors.split(",").map((s) => s.trim()).filter(Boolean),
          materials: form.materials.split(",").map((s) => s.trim()).filter(Boolean),
          dimensions: form.dimensions || null,
          in_stock: form.in_stock,
          featured: form.featured,
        },
      });
      await qc.invalidateQueries({ queryKey: ["admin", "products"] });
      toast.success(product ? "Product updated" : "Product created");
      navigate({ to: "/admin/products" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 grid gap-6 md:grid-cols-2">
      <Field label="Name" value={form.name} onChange={(v) => set("name", v)} required />
      <Field label="Slug" value={form.slug} onChange={(v) => set("slug", v)} required placeholder="e.g. oatmeal-sofa" />

      <Field label="Price (£)" value={form.price} onChange={(v) => set("price", v)} required type="number" step="0.01" />
      <Field label="Compare-at price (£)" value={form.compare} onChange={(v) => set("compare", v)} type="number" step="0.01" />

      <label className="block md:col-span-2">
        <span className="text-xs text-muted-foreground">Category</span>
        <select value={form.category_id} onChange={(e) => set("category_id", e.target.value)} className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm">
          <option value="">— None —</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </label>

      <Field label="Primary image URL" value={form.primary_image_url} onChange={(v) => set("primary_image_url", v)} className="md:col-span-2" placeholder="https://…" />

      <Field label="Short description" value={form.short_description} onChange={(v) => set("short_description", v)} className="md:col-span-2" />

      <label className="block md:col-span-2">
        <span className="text-xs text-muted-foreground">Description</span>
        <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={5} className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
      </label>

      <Field label="Colours (comma-separated)" value={form.colors} onChange={(v) => set("colors", v)} placeholder="Oatmeal, Sand, Slate" />
      <Field label="Materials (comma-separated)" value={form.materials} onChange={(v) => set("materials", v)} placeholder="Bouclé, Oak" />
      <Field label="Dimensions" value={form.dimensions} onChange={(v) => set("dimensions", v)} className="md:col-span-2" placeholder="220 × 92 × 82 cm" />

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={form.in_stock} onChange={(e) => set("in_stock", e.target.checked)} />
        In stock
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={form.featured} onChange={(e) => set("featured", e.target.checked)} />
        Featured on home
      </label>

      <div className="md:col-span-2 flex gap-3">
        <button type="submit" disabled={busy} className="btn-primary disabled:opacity-60">
          {busy ? "Saving…" : product ? "Save changes" : "Create product"}
        </button>
        <button type="button" onClick={() => navigate({ to: "/admin/products" })} className="btn-outline">Cancel</button>
      </div>
    </form>
  );
}

function Field({
  label, value, onChange, required, type = "text", placeholder, step, className,
}: {
  label: string; value: string; onChange: (v: string) => void;
  required?: boolean; type?: string; placeholder?: string; step?: string; className?: string;
}) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="text-xs text-muted-foreground">{label}{required && " *"}</span>
      <input
        type={type}
        step={step}
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm focus:border-foreground focus:outline-none"
      />
    </label>
  );
}
