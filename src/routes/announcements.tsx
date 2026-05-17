import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Pin } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/announcements")({
  component: AnnouncementsPage,
});

function AnnouncementsPage() {
  const { data } = useQuery({
    queryKey: ["announcements"],
    queryFn: async () => (await supabase.from("announcements").select("*").order("pinned", { ascending: false }).order("created_at", { ascending: false })).data ?? [],
  });
  return (
    <div className="min-h-screen">
      <Header />
      <div className="container mx-auto px-4 py-10 max-w-3xl">
        <h1 className="text-4xl font-bold">News & announcements</h1>
        <div className="mt-8 space-y-4">
          {(data?.length ?? 0) === 0 && <div className="glass rounded-2xl p-10 text-center text-muted-foreground">No announcements yet.</div>}
          {(data ?? []).map((a) => (
            <article key={a.id} className="glass-strong rounded-2xl p-6">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {a.pinned && <span className="flex items-center gap-1 text-accent"><Pin className="h-3 w-3" />Pinned</span>}
                <span>{new Date(a.created_at).toLocaleString()}</span>
              </div>
              <h2 className="mt-2 text-2xl font-bold">{a.title}</h2>
              <p className="mt-3 text-muted-foreground whitespace-pre-wrap">{a.body}</p>
            </article>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
