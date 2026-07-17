import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getMyAdminStatus } from "@/lib/admin.functions";
import { toast } from "sonner";
import { Lock } from "lucide-react";
import { z } from "zod";

const searchSchema = z.object({ redirect: z.string().optional() });

export const Route = createFileRoute("/admin/login")({
  ssr: false,
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({ meta: [{ title: "Admin sign in — Atelier" }, { name: "robots", content: "noindex" }] }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      try {
        const { isAdmin } = await getMyAdminStatus();
        if (isAdmin) navigate({ to: redirect ?? "/admin", replace: true });
      } catch {
        /* ignore */
      }
    })();
  }, [navigate, redirect]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const { isAdmin } = await getMyAdminStatus();
      if (!isAdmin) {
        // Signed in but not an admin — send them to /admin so they can claim (bootstrap) or be told no access.
        toast.info("Signed in. Verifying admin access…");
        navigate({ to: "/admin", replace: true });
        return;
      }
      navigate({ to: redirect ?? "/admin", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-16">
      <div className="w-full max-w-md rounded-md border border-border bg-card p-8">
        <div className="flex items-center gap-2 text-accent">
          <Lock className="h-4 w-4" />
          <span className="text-xs uppercase tracking-wide">Staff area</span>
        </div>
        <h1 className="mt-2 font-serif text-3xl">Admin sign in</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Restricted to store administrators. Customers, please use the{" "}
          <Link to="/auth" className="text-accent hover:underline">customer sign-in</Link>.
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-xs text-muted-foreground">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm focus:border-foreground focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="text-xs text-muted-foreground">Password</span>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm focus:border-foreground focus:outline-none"
            />
          </label>
          <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-60">
            {busy ? "Please wait…" : "Sign in to admin"}
          </button>
        </form>
        <div className="mt-6 text-center text-xs text-muted-foreground">
          <Link to="/" className="hover:text-accent">← Back to shop</Link>
        </div>
      </div>
    </div>
  );
}
