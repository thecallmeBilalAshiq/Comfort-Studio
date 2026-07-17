import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { listCategories, listProducts } from "@/lib/shop.functions";
import { ProductCard } from "@/components/site/ProductCard";
import { ArrowRight } from "lucide-react";

const featuredQuery = () =>
  queryOptions({
    queryKey: ["products", "featured"],
    queryFn: () => listProducts({ data: { featured: true } }),
  });

const categoriesQuery = () =>
  queryOptions({
    queryKey: ["categories"],
    queryFn: () => listCategories(),
  });

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(featuredQuery()),
      context.queryClient.ensureQueryData(categoriesQuery()),
    ]);
  },
  component: Index,
});

function Index() {
  const { data: featured } = useSuspenseQuery(featuredQuery());
  const { data: categories } = useSuspenseQuery(categoriesQuery());

  return (
    <div>
      {/* Hero */}
      <section className="relative">
        <div className="container-page grid gap-10 py-16 md:grid-cols-2 md:items-center md:py-24">
          <div>
            <div className="eyebrow">New Season · 2026</div>
            <h1 className="mt-4 font-serif text-5xl leading-[1.05] md:text-6xl">
              Sofas made to be lived in.
            </h1>
            <p className="mt-5 max-w-md text-base text-muted-foreground md:text-lg">
              Hardwood frames. Feather-blend cushions. Delivered fully assembled to your living room by our two-person team.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/collections/$slug" params={{ slug: "sofas" }} className="btn-primary">
                Shop sofas <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/collections/$slug" params={{ slug: "corner-sofas" }} className="btn-outline">
                Corner sofas
              </Link>
            </div>
          </div>
          <div className="relative aspect-[5/4] overflow-hidden rounded-md md:aspect-[4/5]">
            <img
              src="/images/hero-livingroom.jpg"
              alt="Cream boucle sofa in a sunlit living room"
              width={1600}
              height={1000}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container-page py-12">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="font-serif text-3xl">Shop by category</h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((c) => (
            <Link
              key={c.id}
              to="/collections/$slug"
              params={{ slug: c.slug }}
              className="group relative aspect-[4/5] overflow-hidden rounded-md bg-secondary"
            >
              {c.image_url && (
                <img
                  src={c.image_url}
                  alt={c.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/0 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <div className="font-serif text-xl text-white">{c.name}</div>
                <div className="mt-1 flex items-center gap-1 text-xs text-white/85">
                  Shop now <ArrowRight className="h-3 w-3" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="container-page py-16">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <div className="eyebrow">Best sellers</div>
            <h2 className="mt-2 font-serif text-3xl">Featured pieces</h2>
          </div>
          <Link to="/collections/$slug" params={{ slug: "sofas" }} className="text-sm underline underline-offset-4 hover:text-accent">
            View all
          </Link>
        </div>
        <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((p) => (
            <ProductCard
              key={p.id}
              slug={p.slug}
              name={p.name}
              priceCents={p.price_cents}
              compareAtCents={p.compare_at_price_cents}
              imageUrl={p.primary_image_url}
              shortDescription={p.short_description}
            />
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="border-y border-border bg-secondary/40">
        <div className="container-page grid gap-8 py-14 md:grid-cols-3">
          {[
            { t: "Handcrafted", d: "Kiln-dried hardwood frames and 8-way hand-tied springs, built to last decades." },
            { t: "White-glove delivery", d: "Two-person team delivers your sofa fully assembled, in the room of your choice." },
            { t: "15-year frame guarantee", d: "We stand behind every piece we make. If it breaks, we fix it." },
          ].map((v) => (
            <div key={v.t}>
              <div className="font-serif text-xl">{v.t}</div>
              <p className="mt-2 text-sm text-muted-foreground">{v.d}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
