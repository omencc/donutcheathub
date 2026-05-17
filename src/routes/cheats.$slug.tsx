import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Download, Star, Heart, Flag, ArrowLeft, ThumbsUp, ThumbsDown } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CheatCard } from "@/components/cheats/CheatCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/cheats/$slug")({
  component: CheatPage,
});

function CheatPage() {
  const { slug } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: cheat, isLoading } = useQuery({
    queryKey: ["cheat", slug],
    queryFn: async () => {
      const { data } = await supabase
        .from("cheats")
        .select("*, categories(name, slug), screenshots(*), changelog_entries(*)")
        .eq("slug", slug)
        .maybeSingle();
      return data;
    },
  });

  const { data: reviews } = useQuery({
    queryKey: ["reviews", cheat?.id],
    enabled: !!cheat?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("reviews")
        .select("*, profiles(username, display_name, avatar_url)")
        .eq("cheat_id", cheat!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: related } = useQuery({
    queryKey: ["related", cheat?.category_id, cheat?.id],
    enabled: !!cheat?.category_id,
    queryFn: async () => {
      const { data } = await supabase.from("cheats").select("id, slug, title, short_description, thumbnail_url, mc_version, tags, downloads, featured, pinned").eq("status", "published").eq("category_id", cheat!.category_id!).neq("id", cheat!.id).limit(4);
      return data ?? [];
    },
  });

  const { data: fav } = useQuery({
    queryKey: ["fav", user?.id, cheat?.id],
    enabled: !!user?.id && !!cheat?.id,
    queryFn: async () => {
      const { data } = await supabase.from("favorites").select("*").eq("user_id", user!.id).eq("cheat_id", cheat!.id).maybeSingle();
      return !!data;
    },
  });

  const toggleFav = useMutation({
    mutationFn: async () => {
      if (!user) { navigate({ to: "/login" }); return; }
      if (fav) await supabase.from("favorites").delete().eq("user_id", user.id).eq("cheat_id", cheat!.id);
      else await supabase.from("favorites").insert({ user_id: user.id, cheat_id: cheat!.id });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fav"] }),
  });

  const handleDownload = async () => {
    if (!cheat?.download_url) { toast.error("No download link configured yet."); return; }
    await supabase.from("cheats").update({ downloads: (cheat.downloads ?? 0) + 1 }).eq("id", cheat.id);
    window.open(cheat.download_url, "_blank", "noopener");
  };

  if (isLoading) return <div className="min-h-screen"><Header /><div className="container mx-auto px-4 py-12">Loading…</div></div>;
  if (!cheat) throw notFound();

  const avgRating = reviews?.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null;

  return (
    <div className="min-h-screen">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <Link to="/library" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"><ArrowLeft className="h-4 w-4 mr-1" />Back to library</Link>

        <div className="grid lg:grid-cols-[1fr_360px] gap-8">
          <div>
            <div className="glass-strong rounded-2xl overflow-hidden">
              <div className="aspect-[16/8] bg-gradient-to-br from-secondary to-card relative">
                {cheat.thumbnail_url ? <img src={cheat.thumbnail_url} alt={cheat.title} className="absolute inset-0 h-full w-full object-cover" /> : <div className="absolute inset-0 grid place-items-center text-primary/20 text-9xl font-bold">{cheat.title[0]}</div>}
              </div>
              <div className="p-6 md:p-8">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  {cheat.categories && <span className="px-2 py-0.5 rounded bg-primary/15 text-primary">{cheat.categories.name}</span>}
                  {cheat.mc_version && <span className="font-mono">MC {cheat.mc_version}</span>}
                  <span className="flex items-center gap-1"><Download className="h-3 w-3" />{cheat.downloads.toLocaleString()}</span>
                  {avgRating != null && <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-accent text-accent" />{avgRating.toFixed(1)} ({reviews?.length})</span>}
                </div>
                <h1 className="mt-3 text-4xl font-bold neon-text">{cheat.title}</h1>
                <p className="mt-3 text-lg text-muted-foreground">{cheat.short_description}</p>

                <Tabs defaultValue="about" className="mt-8">
                  <TabsList className="glass">
                    <TabsTrigger value="about">About</TabsTrigger>
                    <TabsTrigger value="install">Install</TabsTrigger>
                    <TabsTrigger value="screenshots">Media ({cheat.screenshots?.length ?? 0})</TabsTrigger>
                    <TabsTrigger value="changelog">Changelog</TabsTrigger>
                    <TabsTrigger value="reviews">Reviews ({reviews?.length ?? 0})</TabsTrigger>
                  </TabsList>
                  <TabsContent value="about" className="prose prose-invert max-w-none mt-4">
                    <div className="whitespace-pre-wrap text-muted-foreground">{cheat.long_description || cheat.short_description}</div>
                    <div className="mt-4 flex flex-wrap gap-1">
                      {cheat.tags.map((t: string) => <span key={t} className="text-xs px-2 py-1 rounded-full bg-secondary border border-border/60">#{t}</span>)}
                    </div>
                  </TabsContent>
                  <TabsContent value="install" className="mt-4">
                    <pre className="glass rounded-lg p-5 text-sm whitespace-pre-wrap font-mono text-muted-foreground">{cheat.installation || "No installation instructions provided yet."}</pre>
                  </TabsContent>
                  <TabsContent value="screenshots" className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(cheat.screenshots ?? []).length === 0 && <div className="glass rounded-lg p-6 text-muted-foreground col-span-full">No media uploaded.</div>}
                    {(cheat.screenshots ?? []).map((s: any) => (
                      <div key={s.id} className="glass rounded-lg overflow-hidden">
                        <img src={s.url} alt={s.caption ?? ""} className="w-full h-auto" />
                        {s.caption && <div className="p-2 text-xs text-muted-foreground">{s.caption}</div>}
                      </div>
                    ))}
                  </TabsContent>
                  <TabsContent value="changelog" className="mt-4 space-y-3">
                    {(cheat.changelog_entries ?? []).length === 0 && <div className="glass rounded-lg p-6 text-muted-foreground">No changelog entries.</div>}
                    {(cheat.changelog_entries ?? []).sort((a: any, b: any) => +new Date(b.released_at) - +new Date(a.released_at)).map((e: any) => (
                      <div key={e.id} className="glass rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="font-mono font-semibold text-primary">v{e.version}</div>
                          <div className="text-xs text-muted-foreground">{new Date(e.released_at).toLocaleDateString()}</div>
                        </div>
                        <div className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">{e.notes}</div>
                      </div>
                    ))}
                  </TabsContent>
                  <TabsContent value="reviews" className="mt-4">
                    <ReviewsBlock cheatId={cheat.id} reviews={reviews ?? []} />
                  </TabsContent>
                </Tabs>
              </div>
            </div>

            {(related?.length ?? 0) > 0 && (
              <section className="mt-10">
                <h2 className="text-2xl font-bold mb-4">Related cheats</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {related!.map((c) => <CheatCard key={c.id} cheat={c} />)}
                </div>
              </section>
            )}
          </div>

          {/* Sticky download card */}
          <aside className="lg:sticky lg:top-24 self-start space-y-4">
            <div className="glass-strong rounded-2xl p-5">
              <Button size="lg" onClick={handleDownload} className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground border-0 hover:opacity-90 shadow-[0_0_24px_oklch(0.68_0.22_295/0.4)]">
                <Download className="h-5 w-5 mr-2" />Download
              </Button>
              <div className="mt-3 flex gap-2">
                <Button variant="outline" className="flex-1 glass" onClick={() => toggleFav.mutate()}>
                  <Heart className={`h-4 w-4 mr-1.5 ${fav ? "fill-primary text-primary" : ""}`} />{fav ? "Saved" : "Save"}
                </Button>
                <ReportDialog targetId={cheat.id} />
              </div>
              <dl className="mt-5 space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-muted-foreground">Downloads</dt><dd className="font-mono">{cheat.downloads.toLocaleString()}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">MC version</dt><dd className="font-mono">{cheat.mc_version ?? "—"}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Updated</dt><dd>{new Date(cheat.updated_at).toLocaleDateString()}</dd></div>
              </dl>
            </div>
          </aside>
        </div>
      </div>
      <Footer />
    </div>
  );
}

function ReviewsBlock({ cheatId, reviews }: { cheatId: string; reviews: any[] }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");

  const submit = useMutation({
    mutationFn: async () => {
      if (!user) { navigate({ to: "/login" }); return; }
      const { error } = await supabase.from("reviews").upsert({ cheat_id: cheatId, user_id: user.id, rating, body }, { onConflict: "cheat_id,user_id" });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Review posted"); setBody(""); qc.invalidateQueries({ queryKey: ["reviews"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      {user ? (
        <div className="glass rounded-lg p-4">
          <div className="flex items-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setRating(n)}>
                <Star className={`h-5 w-5 ${n <= rating ? "fill-accent text-accent" : "text-muted-foreground"}`} />
              </button>
            ))}
          </div>
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Share your experience…" className="bg-input/60" />
          <div className="mt-2 flex justify-end">
            <Button onClick={() => submit.mutate()} disabled={submit.isPending} className="bg-primary text-primary-foreground">Post review</Button>
          </div>
        </div>
      ) : (
        <div className="glass rounded-lg p-4 text-sm text-muted-foreground">
          <Link to="/login" className="text-primary">Log in</Link> to leave a review.
        </div>
      )}

      {reviews.length === 0 && <div className="glass rounded-lg p-6 text-muted-foreground">No reviews yet — be the first.</div>}
      {reviews.map((r) => (
        <div key={r.id} className="glass rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-accent grid place-items-center text-xs font-bold text-primary-foreground">{(r.profiles?.username ?? "U")[0]?.toUpperCase()}</div>
              <div>
                <div className="text-sm font-medium">{r.profiles?.display_name ?? r.profiles?.username}</div>
                <div className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</div>
              </div>
            </div>
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((n) => <Star key={n} className={`h-3.5 w-3.5 ${n <= r.rating ? "fill-accent text-accent" : "text-muted-foreground/40"}`} />)}
            </div>
          </div>
          {r.body && <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">{r.body}</p>}
          <div className="mt-3 flex gap-3 text-xs text-muted-foreground">
            <button className="flex items-center gap-1 hover:text-foreground"><ThumbsUp className="h-3 w-3" />Helpful</button>
            <button className="flex items-center gap-1 hover:text-foreground"><ThumbsDown className="h-3 w-3" />Not</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function ReportDialog({ targetId }: { targetId: string }) {
  const { user } = useAuth();
  const [reason, setReason] = useState("");
  const [open, setOpen] = useState(false);
  const submit = async () => {
    if (!user) { toast.error("Log in to report."); return; }
    const { error } = await supabase.from("reports").insert({ reporter_id: user.id, target_type: "cheat", target_id: targetId, reason });
    if (error) toast.error(error.message); else { toast.success("Report submitted"); setOpen(false); }
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="outline" size="icon" className="glass"><Flag className="h-4 w-4" /></Button></DialogTrigger>
      <DialogContent className="glass-strong">
        <DialogHeader><DialogTitle>Report this cheat</DialogTitle></DialogHeader>
        <Textarea placeholder="Why are you reporting it?" value={reason} onChange={(e) => setReason(e.target.value)} className="bg-input/60" />
        <Button onClick={submit} className="bg-primary text-primary-foreground">Submit report</Button>
      </DialogContent>
    </Dialog>
  );
}
