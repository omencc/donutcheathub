import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user, loading, profile, refresh } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (!loading && !user) navigate({ to: "/login" }); }, [user, loading, navigate]);
  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => {
      setDisplayName(data?.display_name ?? "");
      setBio(data?.bio ?? "");
    });
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ display_name: displayName, bio }).eq("id", user.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else { toast.success("Profile saved"); refresh(); }
  };

  return (
    <div className="min-h-screen">
      <Header />
      <div className="container mx-auto px-4 py-10 max-w-2xl">
        <h1 className="text-4xl font-bold">Your profile</h1>
        <p className="text-muted-foreground mt-2">@{profile?.username}</p>
        <div className="glass-strong rounded-2xl p-6 mt-6 space-y-4">
          <div>
            <label className="text-xs text-muted-foreground">Display name</label>
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="mt-1 w-full h-11 px-3 rounded-lg bg-input/60 border border-border outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Bio</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} className="mt-1 w-full px-3 py-2 rounded-lg bg-input/60 border border-border outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <Button onClick={save} disabled={saving} className="bg-gradient-to-r from-primary to-accent text-primary-foreground border-0">{saving ? "Saving…" : "Save changes"}</Button>
        </div>
      </div>
      <Footer />
    </div>
  );
}
