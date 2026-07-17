import { createFileRoute, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { adminGetProduct, adminListCategories } from "@/lib/admin.functions";
import { ProductForm } from "@/components/admin/ProductForm";

const productQuery = (id: string) =>
  queryOptions({ queryKey: ["admin", "product", id], queryFn: () => adminGetProduct({ data: { id } }) });
const categoriesQuery = queryOptions({ queryKey: ["admin", "categories"], queryFn: () => adminListCategories() });

export const Route = createFileRoute("/_authenticated/admin/products/$id")({
  loader: async ({ context, params }) => {
    const p = await context.queryClient.ensureQueryData(productQuery(params.id));
    if (!p) throw notFound();
    await context.queryClient.ensureQueryData(categoriesQuery);
  },
  component: EditProduct,
  errorComponent: ({ error }) => <div className="text-sm text-destructive">{error.message}</div>,
  notFoundComponent: () => <div className="text-sm text-muted-foreground">Product not found.</div>,
});

function EditProduct() {
  const { id } = Route.useParams();
  const { data: product } = useSuspenseQuery(productQuery(id));
  const { data: categories } = useSuspenseQuery(categoriesQuery);
  return (
    <div>
      <h1 className="font-serif text-3xl">Edit product</h1>
      <ProductForm categories={categories} product={product!} />
    </div>
  );
}
