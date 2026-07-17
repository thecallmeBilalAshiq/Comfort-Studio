import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { adminListOrders } from "@/lib/admin.functions";
import { formatPrice } from "@/lib/format";
import { StatusPill } from "@/routes/_authenticated/admin/index";

const ordersQuery = queryOptions({ queryKey: ["admin", "orders"], queryFn: () => adminListOrders() });

export const Route = createFileRoute("/_authenticated/admin/orders/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(ordersQuery),
  component: OrdersList,
  errorComponent: ({ error }) => <div className="text-sm text-destructive">{error.message}</div>,
});

function OrdersList() {
  const { data: orders } = useSuspenseQuery(ordersQuery);
  return (
    <div>
      <h1 className="font-serif text-3xl">Orders</h1>
      <div className="mt-6 overflow-hidden rounded-md border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-secondary/30">
                <td className="px-4 py-3">
                  <Link to="/admin/orders/$id" params={{ id: o.id }} className="hover:text-accent">
                    #{o.id.slice(0, 8)}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{new Date(o.created_at).toLocaleString()}</td>
                <td className="px-4 py-3">
                  {o.full_name}
                  <div className="text-xs text-muted-foreground">{o.email}</div>
                </td>
                <td className="px-4 py-3"><StatusPill status={o.status} /></td>
                <td className="px-4 py-3 text-right">{formatPrice(o.total_cents)}</td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">No orders yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
