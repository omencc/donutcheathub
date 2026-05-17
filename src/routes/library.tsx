import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search, Filter } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CheatCard } from "@/components/cheats/CheatCard";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Search = { q?: string; cat?: string; sort?: "popular" | "downloads" | "newest" };

export const Route = createFileRoute("/library")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    q: typeof s.q === "string" ? s.q : undefined,
    cat: typeof s.cat === "string" ? s.cat : undefined,
    sort: (["popular", "downloads", "newest"] as const).includes(s.sort as never) ? (s.sort as Search["sort"]) : "newest",
  }),
  head: () => ({
    meta: [
      { title: "Library — DonutVault" },
      { name: "description", content: "Browse, search, and filter the full DonutVault cheat library." },
      { property: "og:title", content: "Library — DonutVault" },
    ],
  }),
  component: LibraryPage,
});

function LibraryPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [q, setQ] = useState(search.q ?? "");

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await supabase.from("categories").select("*").order("sort_order")).data ?? [],
  });
  const activeCat = useMemo(() => categories?.find((c) => c.slug === search.cat) ?? null, [categories, search.cat]);

  const { data: cheats, isLoading } = useQuery({
    queryKey: ["library", search.q, search.cat, search.sort, activeCat?.id],
    queryFn: async () => {
      let req = supabase.from("cheats").select("id, slug, title, short_description, thumbnail_url, mc_version, tags, downloads, featured, pinned").eq("status", "published");
      if (search.q) req = req.ilike("title", `%${search.q}%`);
      if (activeCat) req = req.eq("category_id", activeCat.id);
      const col = search.sort === "downloads" ? "downloads" : search.sort === "popular" ? "downloads" : "created_at";
      req = req.order(col, { ascending: false });
      const { data } = await req.limit(60);
      return data ?? [];
    },
  });

  return (
    <div className="min-h-screen">
      <Header />
      <div className="container mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold">{activeCat ? activeCat.name : "Cheat Library"}</h1>
            <p className="text-muted-foreground mt-2">{activeCat?.description ?? "Every cheat, mod, and client in the vault."}</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3 mb-8">
          <form
            onSubmit={(e) => { e.preventDefault(); navigate({ search: (s: any) => ({ ...s, q }) }); }}
            className="relative flex-1"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search cheats…"
              className="w-full h-11 rounded-lg bg-input/60 border border-border pl-10 pr-4 outline-none focus:ring-2 focus:ring-primary/50" />
          </form>

          <Select value={search.cat ?? "all"} onValueChange={(v) => navigate({ search: (s: any) => ({ ...s, cat: v === "all" ? undefined : v }) })}>
            <SelectTrigger className="md:w-48 glass"><Filter className="h-4 w-4 mr-2" /><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent className="glass-strong">
              <SelectItem value="all">All categories</SelectItem>
              {(categories ?? []).map((c) => <SelectItem key={c.id} value={c.slug}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={search.sort ?? "newest"} onValueChange={(v) => navigate({ search: (s: any) => ({ ...s, sort: v as never }) })}>
            <SelectTrigger className="md:w-44 glass"><SelectValue /></SelectTrigger>
            <SelectContent className="glass-strong">
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="downloads">Most downloaded</SelectItem>
              <SelectItem value="popular">Most popular</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="glass rounded-2xl aspect-[4/5] animate-pulse" />)}
          </div>
        ) : (cheats?.length ?? 0) === 0 ? (
          <div className="glass rounded-2xl p-16 text-center text-muted-foreground">
            No cheats match your filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {cheats!.map((c) => <CheatCard key={c.id} cheat={c} />)}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
