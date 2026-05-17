import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Sparkles, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: {
        emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
        data: { display_name: displayName },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Account created — check your email to confirm.");
    navigate({ to: "/login" });
  };

  return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="w-full max-w-md glass-strong rounded-2xl p-8 border border-primary/30">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg mb-6">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-accent grid place-items-center"><Sparkles className="h-5 w-5 text-primary-foreground" /></div>
          <span className="neon-text">DonutVault</span>
        </Link>
        <h1 className="text-2xl font-bold">Join the vault</h1>
        <p className="text-sm text-muted-foreground mt-1">Create your DonutVault account.</p>
        <form onSubmit={submit} className="mt-6 space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">Display name</label>
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="mt-1 w-full h-11 px-3 rounded-lg bg-input/60 border border-border focus:ring-2 focus:ring-primary/50 outline-none" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full h-11 px-3 rounded-lg bg-input/60 border border-border focus:ring-2 focus:ring-primary/50 outline-none" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Password</label>
            <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full h-11 px-3 rounded-lg bg-input/60 border border-border focus:ring-2 focus:ring-primary/50 outline-none" />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground border-0 h-11">
            <UserPlus className="h-4 w-4 mr-2" />{loading ? "Creating…" : "Create account"}
          </Button>
        </form>
        <div className="mt-4 text-sm text-muted-foreground text-center">
          Already have one? <Link to="/login" className="text-primary">Log in</Link>
        </div>
      </div>
    </div>
  );
}
