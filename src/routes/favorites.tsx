import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CheatCard } from "@/components/cheats/CheatCard";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/favorites")({
  component: FavoritesPage,
});

function FavoritesPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => { if (!loading && !user) navigate({ to: "/login" }); }, [user, loading, navigate]);

  const { data } = useQuery({
    queryKey: ["favorites", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("favorites").select("cheats(id, slug, title, short_description, thumbnail_url, mc_version, tags, downloads, featured, pinned)").eq("user_id", user!.id);
      return (data ?? []).map((r: any) => r.cheats).filter(Boolean);
    },
  });

  return (
    <div className="min-h-screen">
      <Header />
      <div className="container mx-auto px-4 py-10">
        <h1 className="text-4xl font-bold">Your favorites</h1>
        <p className="text-muted-foreground mt-2">Cheats you've saved.</p>
        {(data?.length ?? 0) === 0 ? (
          <div className="mt-8 glass rounded-2xl p-12 text-center text-muted-foreground">
            Nothing saved yet. <Link to="/library" className="text-primary">Browse the library</Link>.
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {data!.map((c: any) => <CheatCard key={c.id} cheat={c} />)}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
