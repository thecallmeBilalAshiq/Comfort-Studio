import { Link } from "@tanstack/react-router";
import { ShoppingBag, Menu, X, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useCart, cartCount } from "@/lib/cart";
import { supabase } from "@/integrations/supabase/client";

const NAV = [
  { slug: "sofas", label: "Sofas" },
  { slug: "corner-sofas", label: "Corner Sofas" },
  { slug: "chesterfields", label: "Chesterfields" },
  { slug: "armchairs", label: "Armchairs" },
];

export function Header() {
  const items = useCart();
  const count = cartCount(items);
  const [open, setOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setSignedIn(!!data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setSignedIn(!!session?.user));
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between">
        <button
          className="md:hidden text-foreground"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <Link to="/" className="font-serif text-2xl tracking-tight text-foreground" onClick={() => setOpen(false)}>
          Atelier<span className="text-accent">.</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm">
          {NAV.map((n) => (
            <Link key={n.slug} to="/collections/$slug" params={{ slug: n.slug }} className="hover:text-accent transition-colors">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <Link
            to="/auth"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm text-foreground hover:text-accent transition-colors"
            aria-label={signedIn ? "Account" : "Sign in"}
          >
            <User className="h-4 w-4" />
            <span>{signedIn ? "Account" : "Sign in"}</span>
          </Link>
          <Link to="/cart" className="relative flex items-center text-foreground hover:text-accent transition-colors" aria-label="Cart">
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-medium text-accent-foreground">
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>
      {open && (
        <nav className="md:hidden border-t border-border bg-background">
          <ul className="container-page flex flex-col py-2">
            {NAV.map((n) => (
              <li key={n.slug}>
                <Link
                  to="/collections/$slug"
                  params={{ slug: n.slug }}
                  onClick={() => setOpen(false)}
                  className="block py-3 text-sm hover:text-accent"
                >
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
