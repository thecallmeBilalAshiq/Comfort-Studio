import { createFileRoute, Outlet, Link, useRouter, useRouterState } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useQueryClient } from "@tanstack/react-query";
import { getMyAdminStatus, claimInitialAdmin } from "@/lib/admin.functions";
import { supabase } from "@/integrations/supabase/client";
import { LayoutDashboard, Package, ShoppingCart, LogOut, Home, FolderTree } from "lucide-react";
import { toast } from "sonner";

const adminStatusQuery = queryOptions({
  queryKey: ["admin", "me"],
  queryFn: () => getMyAdminStatus(),
});

export const Route = createFileRoute("/_authenticated/admin")({
  loader: ({ context }) => context.queryClient.ensureQueryData(adminStatusQuery),
  head: () => ({ meta: [{ title: "Admin — Atelier" }, { name: "robots", content: "noindex" }] }),
  component: AdminLayout,
  errorComponent: ({ error }) => (
    <div className="container-page py-16 text-center">
      <h1 className="font-serif text-3xl">Admin unavailable</h1>
      <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
    </div>
  ),
});

function AdminLayout() {
  const { data } = useSuspenseQuery(adminStatusQuery);
  const qc = useQueryClient();
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    router.navigate({ to: "/admin/login", replace: true });
  }

  if (!data.isAdmin) {
    return (
      <div className="container-page flex min-h-[70vh] items-center justify-center py-16">
        <div className="max-w-md rounded-md border border-border bg-card p-8 text-center">
          <h1 className="font-serif text-2xl">Not an admin</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your account doesn't have admin access. If you're setting up the store for the first time, you can claim admin privileges below (only works if no admin exists yet).
          </p>
          <button
            onClick={async () => {
              try {
                await claimInitialAdmin();
                await qc.invalidateQueries({ queryKey: ["admin", "me"] });
                toast.success("Admin access granted");
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Could not claim admin");
              }
            }}
            className="btn-primary mt-6"
          >
            Claim initial admin
          </button>
          <button onClick={signOut} className="btn-outline mt-3 w-full">Sign out</button>
        </div>
      </div>
    );
  }

  const nav = [
    { to: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
    { to: "/admin/products", label: "Products", icon: Package },
    { to: "/admin/categories", label: "Categories", icon: FolderTree },
    { to: "/admin/orders", label: "Orders", icon: ShoppingCart },
  ];

  return (
    <div className="container-page grid gap-8 py-8 md:grid-cols-[220px_1fr]">
      <aside className="h-fit rounded-md border border-border bg-card p-4">
        <div className="px-2 pb-3 font-serif text-xl">Admin</div>
        <nav className="space-y-1">
          {nav.map((n) => {
            const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                  active ? "bg-foreground text-background" : "hover:bg-secondary"
                }`}
              >
                <n.icon className="h-4 w-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-4 space-y-1 border-t border-border pt-4">
          <Link to="/" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-secondary">
            <Home className="h-4 w-4" /> View shop
          </Link>
          <button onClick={signOut} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-secondary">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>
      <section><Outlet /></section>
    </div>
  );
}
