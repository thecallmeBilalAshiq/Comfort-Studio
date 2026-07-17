import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useCart, cartSubtotalCents, clearCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import { createOrder } from "@/lib/shop.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — Atelier" }, { name: "robots", content: "noindex" }] }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const items = useCart();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const subtotal = cartSubtotalCents(items);
  const shipping = subtotal >= 100000 ? 0 : 4900;
  const total = subtotal + shipping;

  if (items.length === 0) {
    return (
      <div className="container-page py-24 text-center">
        <h1 className="font-serif text-3xl">Nothing to check out</h1>
        <p className="mt-2 text-muted-foreground">Your bag is empty.</p>
        <Link to="/" className="btn-primary mt-6 inline-flex">Continue shopping</Link>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await createOrder({
        data: {
          email: String(fd.get("email")),
          fullName: String(fd.get("fullName")),
          phone: String(fd.get("phone") || ""),
          addressLine1: String(fd.get("addressLine1")),
          addressLine2: String(fd.get("addressLine2") || ""),
          city: String(fd.get("city")),
          postcode: String(fd.get("postcode")),
          country: String(fd.get("country") || "GB"),
          notes: String(fd.get("notes") || ""),
          items: items.map((i) => ({
            productId: i.productId,
            variant: i.variant ?? null,
            quantity: i.quantity,
          })),
        },
      });
      clearCart();
      toast.success("Order placed");
      navigate({ to: "/order-confirmation/$id", params: { id: res.orderId } });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      toast.error("Could not place order", { description: msg });
      setSubmitting(false);
    }
  }

  return (
    <div className="container-page py-12">
      <h1 className="font-serif text-4xl">Checkout</h1>
      <form onSubmit={onSubmit} className="mt-10 grid gap-10 lg:grid-cols-[1fr_360px]">
        <div className="space-y-8">
          <section>
            <h2 className="font-serif text-xl">Contact</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Email" name="email" type="email" required />
              <Field label="Phone" name="phone" />
            </div>
          </section>

          <section>
            <h2 className="font-serif text-xl">Delivery address</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Full name" name="fullName" required className="sm:col-span-2" />
              <Field label="Address line 1" name="addressLine1" required className="sm:col-span-2" />
              <Field label="Address line 2" name="addressLine2" className="sm:col-span-2" />
              <Field label="City" name="city" required />
              <Field label="Postcode" name="postcode" required />
              <Field label="Country" name="country" defaultValue="GB" />
            </div>
          </section>

          <section>
            <h2 className="font-serif text-xl">Notes (optional)</h2>
            <textarea
              name="notes"
              rows={3}
              className="mt-4 w-full rounded-md border border-border bg-card p-3 text-sm focus:border-foreground focus:outline-none"
              placeholder="Any delivery notes for our team?"
            />
          </section>
        </div>

        <aside className="h-fit rounded-md border border-border bg-card p-6">
          <h2 className="font-serif text-xl">Your order</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {items.map((i) => (
              <li key={`${i.productId}-${i.variant ?? ""}`} className="flex justify-between gap-3">
                <span className="text-muted-foreground">
                  {i.name}{i.variant ? ` · ${i.variant}` : ""} × {i.quantity}
                </span>
                <span>{formatPrice(i.priceCents * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-5 space-y-1 border-t border-border pt-4 text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd>{formatPrice(subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Shipping</dt><dd>{shipping === 0 ? "Free" : formatPrice(shipping)}</dd></div>
            <div className="mt-2 flex justify-between border-t border-border pt-2 text-base font-medium">
              <dt>Total</dt><dd>{formatPrice(total)}</dd>
            </div>
          </dl>
          <button type="submit" disabled={submitting} className="btn-primary mt-6 w-full disabled:opacity-60">
            {submitting ? "Placing order…" : `Place order — ${formatPrice(total)}`}
          </button>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            You'll receive an order confirmation. Card payment will be enabled shortly.
          </p>
        </aside>
      </form>
    </div>
  );
}

function Field({
  label, name, type = "text", required, defaultValue, className,
}: { label: string; name: string; type?: string; required?: boolean; defaultValue?: string; className?: string }) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="text-xs text-muted-foreground">{label}{required && " *"}</span>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2.5 text-sm focus:border-foreground focus:outline-none"
      />
    </label>
  );
}
