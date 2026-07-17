import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { listCategories, listProducts } from "@/lib/shop.functions";
import { ProductCard } from "@/components/site/ProductCard";

const categoriesQuery = () =>
  queryOptions({ queryKey: ["categories"], queryFn: () => listCategories() });

const productsQuery = (slug: string) =>
  queryOptions({
    queryKey: ["products", "by-category", slug],
    queryFn: () => listProducts({ data: { categorySlug: slug } }),
  });

export const Route = createFileRoute("/collections/$slug")({
  loader: async ({ context, params }) => {
    const cats = await context.queryClient.ensureQueryData(categoriesQuery());
    const category = cats.find((c) => c.slug === params.slug);
    if (!category) throw notFound();
    await context.queryClient.ensureQueryData(productsQuery(params.slug));
    return { category };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Collection not found" }, { name: "robots", content: "noindex" }] };
    return {
      meta: [
        { title: `${loaderData.category.name} — Atelier` },
        { name: "description", content: loaderData.category.description ?? `Browse our ${loaderData.category.name.toLowerCase()}.` },
        { property: "og:title", content: `${loaderData.category.name} — Atelier` },
        { property: "og:description", content: loaderData.category.description ?? "" },
        ...(loaderData.category.image_url ? [{ property: "og:image", content: loaderData.category.image_url }] : []),
      ],
    };
  },
  component: CollectionPage,
  errorComponent: () => <div className="container-page py-20 text-center">Failed to load.</div>,
  notFoundComponent: () => (
    <div className="container-page py-20 text-center">
      <h1 className="font-serif text-3xl">Collection not found</h1>
      <Link to="/" className="btn-outline mt-6 inline-flex">Back to home</Link>
    </div>
  ),
});

function CollectionPage() {
  const { slug } = Route.useParams();
  const { category } = Route.useLoaderData();
  const { data: products } = useSuspenseQuery(productsQuery(slug));

  return (
    <div className="container-page py-12">
      <div className="mb-10 max-w-2xl">
        <div className="eyebrow">Collection</div>
        <h1 className="mt-3 font-serif text-4xl md:text-5xl">{category.name}</h1>
        {category.description && (
          <p className="mt-3 text-muted-foreground">{category.description}</p>
        )}
      </div>

      {products.length === 0 ? (
        <p className="text-muted-foreground">No products in this collection yet.</p>
      ) : (
        <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
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
      )}
    </div>
  );
}
