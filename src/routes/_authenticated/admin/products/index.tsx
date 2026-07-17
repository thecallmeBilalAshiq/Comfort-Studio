import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useQueryClient } from "@tanstack/react-query";
import { adminListProducts, adminDeleteProduct } from "@/lib/admin.functions";
import { formatPrice } from "@/lib/format";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

const productsQuery = queryOptions({ queryKey: ["admin", "products"], queryFn: () => adminListProducts() });

export const Route = createFileRoute("/_authenticated/admin/products/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQuery),
  component: ProductsList,
  errorComponent: ({ error }) => <div className="text-sm text-destructive">{error.message}</div>,
});

function ProductsList() {
  const { data: products } = useSuspenseQuery(productsQuery);
  const qc = useQueryClient();

  async function onDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await adminDeleteProduct({ data: { id } });
      await qc.invalidateQueries({ queryKey: ["admin", "products"] });
      toast.success("Product deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <h1 className="font-serif text-3xl">Products</h1>
        <Link to="/admin/products/new" className="btn-primary inline-flex items-center gap-2">
          <Plus className="h-4 w-4" /> New product
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-md border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-secondary/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {p.primary_image_url && (
                      <img src={p.primary_image_url} alt="" className="h-10 w-10 rounded object-cover" />
                    )}
                    <div>
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-muted-foreground">/{p.slug}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {(p.categories as { name?: string } | null)?.name ?? "—"}
                </td>
                <td className="px-4 py-3">{formatPrice(p.price_cents)}</td>
                <td className="px-4 py-3">
                  {p.in_stock ? <span className="text-emerald-700">In stock</span> : <span className="text-muted-foreground">Out</span>}
                  {p.featured && <span className="ml-2 rounded bg-accent/10 px-1.5 py-0.5 text-xs text-accent">Featured</span>}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <Link to="/admin/products/$id" params={{ id: p.id }} className="rounded p-2 hover:bg-secondary" aria-label="Edit">
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <button onClick={() => onDelete(p.id, p.name)} className="rounded p-2 text-destructive hover:bg-destructive/10" aria-label="Delete">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">No products yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
