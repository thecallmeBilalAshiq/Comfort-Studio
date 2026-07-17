import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useState } from "react";
import { getProductBySlug } from "@/lib/shop.functions";
import { formatPrice } from "@/lib/format";
import { addToCart } from "@/lib/cart";
import { toast } from "sonner";
import { Check, Truck, ShieldCheck, Minus, Plus } from "lucide-react";

const productQuery = (slug: string) =>
  queryOptions({
    queryKey: ["product", slug],
    queryFn: () => getProductBySlug({ data: { slug } }),
  });

export const Route = createFileRoute("/products/$slug")({
  loader: async ({ context, params }) => {
    const product = await context.queryClient.ensureQueryData(productQuery(params.slug));
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Product not found" }, { name: "robots", content: "noindex" }] };
    const p = loaderData.product;
    return {
      meta: [
        { title: `${p.name} — Atelier` },
        { name: "description", content: p.short_description ?? p.description.slice(0, 155) },
        { property: "og:title", content: `${p.name} — Atelier` },
        { property: "og:description", content: p.short_description ?? "" },
        ...(p.primary_image_url ? [{ property: "og:image", content: p.primary_image_url }] : []),
      ],
    };
  },
  component: ProductPage,
  errorComponent: () => <div className="container-page py-20 text-center">Failed to load product.</div>,
  notFoundComponent: () => (
    <div className="container-page py-20 text-center">
      <h1 className="font-serif text-3xl">Product not found</h1>
      <Link to="/" className="btn-outline mt-6 inline-flex">Back to home</Link>
    </div>
  ),
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { data: product } = useSuspenseQuery(productQuery(slug));
  const p = product!;
  const [color, setColor] = useState<string>(p.colors[0] ?? "");
  const [qty, setQty] = useState(1);

  return (
    <div className="container-page py-10 md:py-16">
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-accent">Home</Link>
        {p.categories && (
          <>
            {" / "}
            <Link to="/collections/$slug" params={{ slug: (p.categories as { slug: string }).slug }} className="hover:text-accent">
              {(p.categories as { name: string }).name}
            </Link>
          </>
        )}
        {" / "}<span className="text-foreground">{p.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <div className="overflow-hidden rounded-md bg-secondary/60">
          {p.primary_image_url && (
            <img src={p.primary_image_url} alt={p.name} className="h-full w-full object-cover" />
          )}
        </div>

        <div className="lg:pl-6">
          <div className="eyebrow">{(p.categories as { name?: string } | null)?.name ?? "Furniture"}</div>
          <h1 className="mt-2 font-serif text-4xl md:text-5xl">{p.name}</h1>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-2xl font-medium">{formatPrice(p.price_cents)}</span>
            {p.compare_at_price_cents && p.compare_at_price_cents > p.price_cents && (
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(p.compare_at_price_cents)}
              </span>
            )}
          </div>

          <p className="mt-6 leading-relaxed text-muted-foreground">{p.description}</p>

          {p.colors.length > 0 && (
            <div className="mt-8">
              <div className="eyebrow mb-3">Colour — {color}</div>
              <div className="flex flex-wrap gap-2">
                {p.colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                      color === c ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 flex items-center gap-4">
            <div className="flex items-center rounded-md border border-border">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="p-3 hover:text-accent" aria-label="Decrease quantity">
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-10 text-center text-sm font-medium">{qty}</span>
              <button onClick={() => setQty((q) => q + 1)} className="p-3 hover:text-accent" aria-label="Increase quantity">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <button
              className="btn-primary flex-1"
              onClick={() => {
                addToCart(
                  {
                    productId: p.id,
                    slug: p.slug,
                    name: p.name,
                    priceCents: p.price_cents,
                    imageUrl: p.primary_image_url ?? "",
                    variant: color || undefined,
                  },
                  qty,
                );
                toast.success("Added to bag", { description: `${p.name}${color ? ` · ${color}` : ""}` });
              }}
            >
              Add to bag — {formatPrice(p.price_cents * qty)}
            </button>
          </div>

          <ul className="mt-8 space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-3"><Truck className="mt-0.5 h-4 w-4 text-accent" /> Free UK delivery on orders over £1,000</li>
            <li className="flex gap-3"><ShieldCheck className="mt-0.5 h-4 w-4 text-accent" /> 15-year frame guarantee</li>
            <li className="flex gap-3"><Check className="mt-0.5 h-4 w-4 text-accent" /> Delivered fully assembled</li>
          </ul>

          {(p.materials.length > 0 || p.dimensions) && (
            <div className="mt-10 grid gap-6 border-t border-border pt-6 sm:grid-cols-2">
              {p.materials.length > 0 && (
                <div>
                  <div className="eyebrow mb-2">Materials</div>
                  <div className="text-sm">{p.materials.join(" · ")}</div>
                </div>
              )}
              {p.dimensions && (
                <div>
                  <div className="eyebrow mb-2">Dimensions</div>
                  <div className="text-sm">{p.dimensions}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
