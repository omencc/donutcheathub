import { Link, useRouter } from "@tanstack/react-router";
import { Search, Sparkles, User as UserIcon, LogOut, Shield, Heart, Menu } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const nav = [
  { to: "/", label: "Home" },
  { to: "/library", label: "Library" },
  { to: "/library?cat=combat", label: "Combat" },
  { to: "/library?cat=movement", label: "Movement" },
  { to: "/library?cat=visuals", label: "Visuals" },
  { to: "/announcements", label: "News" },
];

export function Header() {
  const { user, isAdmin, profile, signOut } = useAuth();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.navigate({ to: "/library", search: { q } as never });
  };

  return (
    <header className="sticky top-0 z-50 glass-strong border-b border-border/60">
      <div className="container mx-auto flex items-center gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg">
          <div className="relative h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-accent grid place-items-center animate-pulse-glow">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="neon-text tracking-tight">DonutVault</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 ml-4">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to.split("?")[0]}
              search={n.to.includes("?") ? { cat: n.to.split("cat=")[1] } as never : undefined}
              className="px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition"
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <form onSubmit={submitSearch} className="ml-auto hidden sm:flex items-center relative">
          <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search cheats…"
            className="h-9 w-56 lg:w-72 rounded-lg bg-input/60 border border-border pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition"
          />
        </form>

        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-accent grid place-items-center text-xs font-semibold text-primary-foreground">
                  {(profile?.display_name ?? profile?.username ?? user.email ?? "U")[0]?.toUpperCase()}
                </div>
                <span className="hidden sm:inline">{profile?.username ?? "account"}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 glass-strong">
              <DropdownMenuLabel>Signed in</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild><Link to="/profile"><UserIcon className="h-4 w-4 mr-2" />Profile</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link to="/favorites"><Heart className="h-4 w-4 mr-2" />Favorites</Link></DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem asChild>
                  <Link to="/control-panel"><Shield className="h-4 w-4 mr-2" />Admin Dashboard</Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut().then(() => router.navigate({ to: "/" }))}>
                <LogOut className="h-4 w-4 mr-2" />Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm"><Link to="/login">Log in</Link></Button>
            <Button asChild size="sm" className="bg-gradient-to-r from-primary to-accent text-primary-foreground border-0 hover:opacity-90"><Link to="/signup">Sign up</Link></Button>
          </div>
        )}

        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen((o) => !o)}>
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border/60 px-4 py-2 flex flex-col">
          {nav.map((n) => (
            <Link key={n.to} to={n.to.split("?")[0]} search={n.to.includes("?") ? { cat: n.to.split("cat=")[1] } as never : undefined} className="py-2 text-sm text-muted-foreground" onClick={() => setMobileOpen(false)}>
              {n.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
