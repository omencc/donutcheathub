import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Sparkles, ArrowRight, Zap, Shield, Cpu, Eye, Wrench, Bug, ChevronLeft, ChevronRight, TrendingUp, Clock } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CheatCard } from "@/components/cheats/CheatCard";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DonutVault — DonutsMP Client Library" },
      { name: "description", content: "Download featured cheats and mods for DonutsMP. Trending, latest, and curated daily." },
      { property: "og:title", content: "DonutVault — DonutsMP Client Library" },
      { property: "og:description", content: "Featured & trending cheats for DonutsMP." },
    ],
  }),
  component: HomePage,
});

const catIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  combat: Zap, movement: Cpu, utility: Wrench, visuals: Eye, exploits: Bug,
};

function HomePage() {
  const { data: featured } = useQuery({
    queryKey: ["featured"],
    queryFn: async () => {
      const { data } = await supabase.from("cheats").select("id, slug, title, short_description, thumbnail_url, mc_version, tags, downloads, featured, pinned").eq("status", "published").eq("featured", true).order("pinned", { ascending: false }).limit(6);
      return data ?? [];
    },
  });
  const { data: trending } = useQuery({
    queryKey: ["trending"],
    queryFn: async () => {
      const { data } = await supabase.from("cheats").select("id, slug, title, short_description, thumbnail_url, mc_version, tags, downloads, featured, pinned").eq("status", "published").order("downloads", { ascending: false }).limit(8);
      return data ?? [];
    },
  });
  const { data: latest } = useQuery({
    queryKey: ["latest"],
    queryFn: async () => {
      const { data } = await supabase.from("cheats").select("id, slug, title, short_description, thumbnail_url, mc_version, tags, downloads, featured, pinned").eq("status", "published").order("created_at", { ascending: false }).limit(8);
      return data ?? [];
    },
  });
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*").order("sort_order");
      return data ?? [];
    },
  });
  const { data: announcement } = useQuery({
    queryKey: ["announcement"],
    queryFn: async () => {
      const { data } = await supabase.from("announcements").select("*").order("pinned", { ascending: false }).order("created_at", { ascending: false }).limit(1).maybeSingle();
      return data;
    },
  });

  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero / Carousel */}
      <section className="relative overflow-hidden">
        <div className="grid-bg absolute inset-0 opacity-40" />
        <div className="container mx-auto px-4 pt-16 pb-12 relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 glass rounded-full px-3 py-1 text-xs">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              <span className="text-muted-foreground">Curated client library · DonutsMP</span>
            </div>
            <h1 className="mt-5 text-5xl md:text-7xl font-bold tracking-tight">
              The <span className="neon-text">vault</span> of every<br />cheat you'll ever need.
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-2xl">
              Hand-picked combat, movement, visual & utility mods. Tested. Updated. Downloaded by thousands.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-gradient-to-r from-primary to-accent text-primary-foreground border-0 hover:opacity-90 shadow-[0_0_30px_oklch(0.68_0.22_295/0.4)]">
                <Link to="/library">Browse library <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="glass">
                <Link to="/library" search={{ cat: "combat" } as never}>Combat picks</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured carousel */}
      {(featured?.length ?? 0) > 0 && (
        <section className="container mx-auto px-4 py-8">
          <FeaturedCarousel items={featured ?? []} />
        </section>
      )}

      {announcement && (
        <section className="container mx-auto px-4 mt-2">
          <div className="glass-strong rounded-xl border-l-4 border-l-accent px-5 py-4 flex items-start gap-3">
            <Shield className="h-5 w-5 text-accent mt-0.5" />
            <div className="flex-1">
              <div className="text-xs uppercase tracking-wider text-accent mb-1">Announcement</div>
              <div className="font-semibold">{announcement.title}</div>
              <div className="text-sm text-muted-foreground mt-1">{announcement.body}</div>
            </div>
          </div>
        </section>
      )}

      {/* Categories */}
      <section className="container mx-auto px-4 mt-16">
        <h2 className="text-2xl font-bold mb-6">Categories</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {(categories ?? []).map((c) => {
            const Icon = catIcons[c.slug] ?? Sparkles;
            return (
              <Link key={c.id} to="/library" search={{ cat: c.slug } as never}
                className="glass rounded-xl p-5 hover:border-primary/60 hover:-translate-y-1 transition-all group">
                <Icon className="h-7 w-7 text-primary group-hover:text-accent transition" />
                <div className="mt-3 font-semibold">{c.name}</div>
                <div className="text-xs text-muted-foreground mt-1">{c.description}</div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Trending */}
      <section className="container mx-auto px-4 mt-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2"><TrendingUp className="h-6 w-6 text-accent" />Trending</h2>
          <Link to="/library" className="text-sm text-muted-foreground hover:text-foreground">View all →</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {(trending ?? []).map((c) => <CheatCard key={c.id} cheat={c} />)}
          {(trending?.length ?? 0) === 0 && <EmptyHint />}
        </div>
      </section>

      {/* Latest */}
      <section className="container mx-auto px-4 mt-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2"><Clock className="h-6 w-6 text-primary" />Latest uploads</h2>
          <Link to="/library" className="text-sm text-muted-foreground hover:text-foreground">View all →</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {(latest ?? []).map((c) => <CheatCard key={c.id} cheat={c} />)}
          {(latest?.length ?? 0) === 0 && <EmptyHint />}
        </div>
      </section>

      <Footer />
    </div>
  );
}

function EmptyHint() {
  return (
    <div className="col-span-full glass rounded-xl p-10 text-center text-muted-foreground">
      No cheats yet. Sign in as admin and upload your first one from the dashboard.
    </div>
  );
}

function FeaturedCarousel({ items }: { items: any[] }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (items.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % items.length), 5500);
    return () => clearInterval(t);
  }, [items.length]);
  if (items.length === 0) return null;
  const item = items[idx];
  return (
    <div className="relative glass-strong rounded-2xl overflow-hidden border border-primary/30">
      <div className="grid md:grid-cols-2 gap-0">
        <div className="aspect-video md:aspect-auto md:h-80 relative bg-gradient-to-br from-secondary to-card">
          {item.thumbnail_url ? <img src={item.thumbnail_url} alt={item.title} className="absolute inset-0 h-full w-full object-cover" /> : <div className="absolute inset-0 grid place-items-center text-primary/20 text-9xl font-bold">{item.title[0]}</div>}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-background/70 md:to-background" />
        </div>
        <div className="p-8 md:p-10 flex flex-col justify-center">
          <span className="text-xs uppercase tracking-wider text-accent mb-2 flex items-center gap-1"><Sparkles className="h-3 w-3" /> Featured</span>
          <h3 className="text-3xl font-bold">{item.title}</h3>
          <p className="mt-3 text-muted-foreground">{item.short_description}</p>
          <div className="mt-5">
            <Button asChild className="bg-gradient-to-r from-primary to-accent text-primary-foreground border-0">
              <Link to="/cheats/$slug" params={{ slug: item.slug }}>View cheat <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </div>
      {items.length > 1 && (
        <>
          <button onClick={() => setIdx((i) => (i - 1 + items.length) % items.length)} className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full glass grid place-items-center hover:bg-primary/30"><ChevronLeft className="h-4 w-4" /></button>
          <button onClick={() => setIdx((i) => (i + 1) % items.length)} className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full glass grid place-items-center hover:bg-primary/30"><ChevronRight className="h-4 w-4" /></button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
            {items.map((_, i) => (
              <button key={i} onClick={() => setIdx(i)} className={`h-1.5 rounded-full transition-all ${i === idx ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/40"}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
