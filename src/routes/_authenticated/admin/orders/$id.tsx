import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useQueryClient } from "@tanstack/react-query";
import { adminGetOrder, adminUpdateOrderStatus } from "@/lib/admin.functions";
import { formatPrice } from "@/lib/format";
import { StatusPill } from "@/routes/_authenticated/admin/index";
import { toast } from "sonner";

const orderQuery = (id: string) =>
  queryOptions({ queryKey: ["admin", "order", id], queryFn: () => adminGetOrder({ data: { id } }) });

export const Route = createFileRoute("/_authenticated/admin/orders/$id")({
  loader: async ({ context, params }) => {
    const o = await context.queryClient.ensureQueryData(orderQuery(params.id));
    if (!o) throw notFound();
  },
  component: OrderDetail,
  errorComponent: ({ error }) => <div className="text-sm text-destructive">{error.message}</div>,
  notFoundComponent: () => <div className="text-sm text-muted-foreground">Order not found.</div>,
});

const STATUSES = ["pending", "paid", "processing", "shipped", "delivered", "cancelled"] as const;

function OrderDetail() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(orderQuery(id));
  const o = data!;
  const qc = useQueryClient();

  async function changeStatus(status: (typeof STATUSES)[number]) {
    try {
      await adminUpdateOrderStatus({ data: { id: o.id, status } });
      await qc.invalidateQueries({ queryKey: ["admin", "order", o.id] });
      await qc.invalidateQueries({ queryKey: ["admin", "orders"] });
      toast.success(`Order marked as ${status}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  }

  const items = (o.order_items ?? []) as Array<{
    id: string; product_name: string; variant_label: string | null; quantity: number; unit_price_cents: number; line_total_cents: number;
  }>;

  return (
    <div>
      <Link to="/admin/orders" className="text-sm text-muted-foreground hover:text-accent">← All orders</Link>
      <div className="mt-2 flex items-baseline justify-between gap-4">
        <h1 className="font-serif text-3xl">Order #{o.id.slice(0, 8)}</h1>
        <StatusPill status={o.status} />
      </div>
      <div className="mt-1 text-sm text-muted-foreground">{new Date(o.created_at).toLocaleString()}</div>

      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_320px]">
        <div className="rounded-md border border-border">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3">Qty</th>
                <th className="px-4 py-3 text-right">Line total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((it) => (
                <tr key={it.id}>
                  <td className="px-4 py-3">
                    {it.product_name}
                    {it.variant_label && <div className="text-xs text-muted-foreground">{it.variant_label}</div>}
                    <div className="text-xs text-muted-foreground">{formatPrice(it.unit_price_cents)} each</div>
                  </td>
                  <td className="px-4 py-3">{it.quantity}</td>
                  <td className="px-4 py-3 text-right">{formatPrice(it.line_total_cents)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="text-sm">
              <tr><td colSpan={2} className="px-4 py-2 text-right text-muted-foreground">Subtotal</td><td className="px-4 py-2 text-right">{formatPrice(o.subtotal_cents)}</td></tr>
              <tr><td colSpan={2} className="px-4 py-2 text-right text-muted-foreground">Shipping</td><td className="px-4 py-2 text-right">{o.shipping_cents === 0 ? "Free" : formatPrice(o.shipping_cents)}</td></tr>
              <tr className="border-t border-border font-medium"><td colSpan={2} className="px-4 py-3 text-right">Total</td><td className="px-4 py-3 text-right">{formatPrice(o.total_cents)}</td></tr>
            </tfoot>
          </table>
        </div>

        <aside className="space-y-6">
          <div className="rounded-md border border-border bg-card p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Status</div>
            <select
              value={o.status}
              onChange={(e) => changeStatus(e.target.value as (typeof STATUSES)[number])}
              className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="rounded-md border border-border bg-card p-4 text-sm">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Customer</div>
            <div className="mt-2">{o.full_name}</div>
            <div className="text-muted-foreground">{o.email}</div>
            {o.phone && <div className="text-muted-foreground">{o.phone}</div>}
          </div>

          <div className="rounded-md border border-border bg-card p-4 text-sm">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Delivery address</div>
            <div className="mt-2 whitespace-pre-line">
              {o.address_line1}
              {o.address_line2 ? `\n${o.address_line2}` : ""}
              {`\n${o.city}, ${o.postcode}`}
              {`\n${o.country}`}
            </div>
          </div>

          {o.notes && (
            <div className="rounded-md border border-border bg-card p-4 text-sm">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Notes</div>
              <div className="mt-2 whitespace-pre-line">{o.notes}</div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
