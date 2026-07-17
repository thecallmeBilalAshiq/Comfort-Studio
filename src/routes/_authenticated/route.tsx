import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      const path = typeof window !== "undefined" ? window.location.pathname : "/";
      const isAdminArea = path.startsWith("/admin");
      throw redirect({
        to: isAdminArea ? "/admin/login" : "/auth",
        search: { redirect: path },
      });
    }
    return { user: data.user };
  },
  component: () => <Outlet />,
});
