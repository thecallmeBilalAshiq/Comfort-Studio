import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { adminListCategories } from "@/lib/admin.functions";
import { ProductForm } from "@/components/admin/ProductForm";

const categoriesQuery = queryOptions({ queryKey: ["admin", "categories"], queryFn: () => adminListCategories() });

export const Route = createFileRoute("/_authenticated/admin/products/new")({
  loader: ({ context }) => context.queryClient.ensureQueryData(categoriesQuery),
  component: NewProduct,
  errorComponent: ({ error }) => <div className="text-sm text-destructive">{error.message}</div>,
});

function NewProduct() {
  const { data: categories } = useSuspenseQuery(categoriesQuery);
  return (
    <div>
      <h1 className="font-serif text-3xl">New product</h1>
      <ProductForm categories={categories} />
    </div>
  );
}
