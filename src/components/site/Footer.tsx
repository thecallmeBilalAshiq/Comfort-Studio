import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-secondary/40">
      <div className="container-page grid gap-10 py-14 md:grid-cols-4">
        <div>
          <div className="font-serif text-2xl">Atelier<span className="text-accent">.</span></div>
          <p className="mt-3 text-sm text-muted-foreground">
            Handcrafted sofas and armchairs, made to live in for years.
          </p>
        </div>
        <div>
          <div className="eyebrow mb-3">Shop</div>
          <ul className="space-y-2 text-sm">
            <li><Link to="/collections/$slug" params={{ slug: "sofas" }} className="hover:text-accent">Sofas</Link></li>
            <li><Link to="/collections/$slug" params={{ slug: "corner-sofas" }} className="hover:text-accent">Corner Sofas</Link></li>
            <li><Link to="/collections/$slug" params={{ slug: "chesterfields" }} className="hover:text-accent">Chesterfields</Link></li>
            <li><Link to="/collections/$slug" params={{ slug: "armchairs" }} className="hover:text-accent">Armchairs</Link></li>
          </ul>
        </div>
        <div>
          <div className="eyebrow mb-3">Help</div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Delivery &amp; Returns</li>
            <li>Care Guide</li>
            <li>Contact</li>
          </ul>
        </div>
        <div>
          <div className="eyebrow mb-3">Newsletter</div>
          <p className="text-sm text-muted-foreground">Fresh drops and interior stories. No spam.</p>
        </div>
      </div>
      <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Atelier Furniture. All rights reserved.
      </div>
    </footer>
  );
}
