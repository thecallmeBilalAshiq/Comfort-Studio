import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { getOrder } from "@/lib/shop.functions";
import { formatPrice } from "@/lib/format";
import { CheckCircle2 } from "lucide-react";

const orderQuery = (id: string) =>
  queryOptions({ queryKey: ["order", id], queryFn: () => getOrder({ data: { id } }) });

export const Route = createFileRoute("/order-confirmation/$id")({
  loader: async ({ context, params }) => {
    const order = await context.queryClient.ensureQueryData(orderQuery(params.id));
    if (!order) throw notFound();
  },
  head: () => ({ meta: [{ title: "Order confirmed — Atelier" }, { name: "robots", content: "noindex" }] }),
  component: ConfirmationPage,
  errorComponent: () => <div className="container-page py-20 text-center">Order not found.</div>,
  notFoundComponent: () => <div className="container-page py-20 text-center">Order not found.</div>,
});

function ConfirmationPage() {
  const { id } = Route.useParams();
  const { data: order } = useSuspenseQuery(orderQuery(id));
  const o = order!;
  const items = (o.order_items ?? []) as Array<{
    id: string; product_name: string; variant_label: string | null; quantity: number; line_total_cents: number;
  }>;

  return (
    <div className="container-page py-16">
      <div className="mx-auto max-w-2xl text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-accent" />
        <h1 className="mt-4 font-serif text-4xl">Thank you, {o.full_name.split(" ")[0]}</h1>
        <p className="mt-2 text-muted-foreground">
          Your order has been received. We've sent a confirmation to <span className="text-foreground">{o.email}</span>.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">Order #{o.id.slice(0, 8).toUpperCase()}</p>
      </div>

      <div className="mx-auto mt-10 max-w-2xl rounded-md border border-border bg-card p-6">
        <h2 className="font-serif text-xl">Order summary</h2>
        <ul className="mt-4 divide-y divide-border">
          {items.map((i) => (
            <li key={i.id} className="flex justify-between gap-3 py-3 text-sm">
              <span>
                {i.product_name}
                {i.variant_label ? ` · ${i.variant_label}` : ""} × {i.quantity}
              </span>
              <span>{formatPrice(i.line_total_cents)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-1 border-t border-border pt-4 text-sm">
          <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd>{formatPrice(o.subtotal_cents)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted-foreground">Shipping</dt><dd>{o.shipping_cents === 0 ? "Free" : formatPrice(o.shipping_cents)}</dd></div>
          <div className="mt-2 flex justify-between border-t border-border pt-2 text-base font-medium">
            <dt>Total</dt><dd>{formatPrice(o.total_cents)}</dd>
          </div>
        </dl>

        <div className="mt-6 border-t border-border pt-4 text-sm">
          <div className="eyebrow mb-2">Delivery to</div>
          <p className="text-muted-foreground">
            {o.full_name}<br />
            {o.address_line1}{o.address_line2 ? `, ${o.address_line2}` : ""}<br />
            {o.city}, {o.postcode}<br />
            {o.country}
          </p>
        </div>
      </div>

      <div className="mt-10 text-center">
        <Link to="/" className="btn-outline">Continue shopping</Link>
      </div>
    </div>
  );
}
