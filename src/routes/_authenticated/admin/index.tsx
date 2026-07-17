import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { adminListOrders, adminListProducts } from "@/lib/admin.functions";
import { formatPrice } from "@/lib/format";

const ordersQuery = queryOptions({ queryKey: ["admin", "orders"], queryFn: () => adminListOrders() });
const productsQuery = queryOptions({ queryKey: ["admin", "products"], queryFn: () => adminListProducts() });

export const Route = createFileRoute("/_authenticated/admin/")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(ordersQuery);
    context.queryClient.ensureQueryData(productsQuery);
  },
  component: Overview,
  errorComponent: ({ error }) => <div className="text-sm text-destructive">{error.message}</div>,
});

function Overview() {
  const { data: orders } = useSuspenseQuery(ordersQuery);
  const { data: products } = useSuspenseQuery(productsQuery);
  const revenue = orders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + o.total_cents, 0);
  const pending = orders.filter((o) => o.status === "pending").length;

  return (
    <div>
      <h1 className="font-serif text-3xl">Overview</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Products" value={String(products.length)} />
        <Stat label="Orders" value={String(orders.length)} sub={`${pending} pending`} />
        <Stat label="Revenue" value={formatPrice(revenue)} />
      </div>

      <div className="mt-10">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-serif text-xl">Recent orders</h2>
          <Link to="/admin/orders" className="text-sm text-accent hover:underline">View all →</Link>
        </div>
        <div className="overflow-hidden rounded-md border border-border">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.slice(0, 8).map((o) => (
                <tr key={o.id} className="hover:bg-secondary/30">
                  <td className="px-4 py-3">
                    <Link to="/admin/orders/$id" params={{ id: o.id }} className="hover:text-accent">
                      #{o.id.slice(0, 8)}
                    </Link>
                    <div className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</div>
                  </td>
                  <td className="px-4 py-3">{o.full_name}<div className="text-xs text-muted-foreground">{o.email}</div></td>
                  <td className="px-4 py-3"><StatusPill status={o.status} /></td>
                  <td className="px-4 py-3 text-right">{formatPrice(o.total_cents)}</td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-muted-foreground">No orders yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-md border border-border bg-card p-5">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-2 font-serif text-3xl">{value}</div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800",
    paid: "bg-emerald-100 text-emerald-800",
    processing: "bg-blue-100 text-blue-800",
    shipped: "bg-indigo-100 text-indigo-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-rose-100 text-rose-800",
  };
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${map[status] ?? "bg-secondary"}`}>{status}</span>;
}
