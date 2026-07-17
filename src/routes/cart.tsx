import { createFileRoute, Link } from "@tanstack/react-router";
import { useCart, updateQuantity, removeFromCart, cartSubtotalCents } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import { Minus, Plus, X, ShoppingBag } from "lucide-react";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Your bag — Atelier" }, { name: "description", content: "Review the pieces in your bag." }] }),
  component: CartPage,
});

function CartPage() {
  const items = useCart();
  const subtotal = cartSubtotalCents(items);
  const shipping = subtotal === 0 ? 0 : subtotal >= 100000 ? 0 : 4900;
  const total = subtotal + shipping;

  if (items.length === 0) {
    return (
      <div className="container-page py-24 text-center">
        <ShoppingBag className="mx-auto h-10 w-10 text-muted-foreground" />
        <h1 className="mt-4 font-serif text-3xl">Your bag is empty</h1>
        <p className="mt-2 text-muted-foreground">Browse our sofas to find your next piece.</p>
        <Link to="/collections/$slug" params={{ slug: "sofas" }} className="btn-primary mt-6 inline-flex">Shop sofas</Link>
      </div>
    );
  }

  return (
    <div className="container-page py-12">
      <h1 className="font-serif text-4xl">Your bag</h1>
      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_360px]">
        <ul className="divide-y divide-border">
          {items.map((i) => (
            <li key={`${i.productId}-${i.variant ?? ""}`} className="flex gap-4 py-6">
              <Link to="/products/$slug" params={{ slug: i.slug }} className="h-28 w-28 shrink-0 overflow-hidden rounded-md bg-secondary">
                {i.imageUrl && <img src={i.imageUrl} alt={i.name} className="h-full w-full object-cover" />}
              </Link>
              <div className="flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Link to="/products/$slug" params={{ slug: i.slug }} className="font-serif text-lg hover:text-accent">
                      {i.name}
                    </Link>
                    {i.variant && <div className="mt-0.5 text-xs text-muted-foreground">Colour: {i.variant}</div>}
                  </div>
                  <button onClick={() => removeFromCart(i.productId, i.variant)} className="text-muted-foreground hover:text-foreground" aria-label="Remove">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-auto flex items-center justify-between">
                  <div className="flex items-center rounded-md border border-border">
                    <button onClick={() => updateQuantity(i.productId, i.variant, i.quantity - 1)} className="p-2 hover:text-accent" aria-label="Decrease">
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm">{i.quantity}</span>
                    <button onClick={() => updateQuantity(i.productId, i.variant, i.quantity + 1)} className="p-2 hover:text-accent" aria-label="Increase">
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="font-medium">{formatPrice(i.priceCents * i.quantity)}</div>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="h-fit rounded-md border border-border bg-card p-6">
          <h2 className="font-serif text-xl">Order summary</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd>{formatPrice(subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Shipping</dt><dd>{shipping === 0 ? "Free" : formatPrice(shipping)}</dd></div>
            <div className="mt-3 flex justify-between border-t border-border pt-3 text-base font-medium">
              <dt>Total</dt><dd>{formatPrice(total)}</dd>
            </div>
          </dl>
          <Link to="/checkout" className="btn-primary mt-6 w-full">Checkout</Link>
          <p className="mt-3 text-center text-xs text-muted-foreground">Taxes calculated at checkout</p>
        </aside>
      </div>
    </div>
  );
}
