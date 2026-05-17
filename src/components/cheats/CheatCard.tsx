import { Link } from "@tanstack/react-router";
import { Download, Star, Pin, Flame } from "lucide-react";

export type CheatCardData = {
  id: string;
  slug: string;
  title: string;
  short_description: string;
  thumbnail_url: string | null;
  mc_version: string | null;
  tags: string[];
  downloads: number;
  featured: boolean;
  pinned: boolean;
  rating?: number | null;
};

export function CheatCard({ cheat }: { cheat: CheatCardData }) {
  return (
    <Link
      to="/cheats/$slug"
      params={{ slug: cheat.slug }}
      className="group glass rounded-2xl overflow-hidden border border-border/60 hover:border-primary/60 transition-all hover:-translate-y-1 hover:shadow-[0_0_30px_oklch(0.68_0.22_295/0.25)]"
    >
      <div className="relative aspect-video bg-gradient-to-br from-secondary to-card overflow-hidden">
        {cheat.thumbnail_url ? (
          <img src={cheat.thumbnail_url} alt={cheat.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
        ) : (
          <div className="h-full w-full grid place-items-center text-primary/30 text-5xl font-bold">{cheat.title[0]}</div>
        )}
        <div className="absolute top-2 left-2 flex gap-1">
          {cheat.pinned && <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-primary/90 text-primary-foreground flex items-center gap-1"><Pin className="h-3 w-3" />Pinned</span>}
          {cheat.featured && <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-accent/90 text-accent-foreground flex items-center gap-1"><Flame className="h-3 w-3" />Hot</span>}
        </div>
        {cheat.mc_version && (
          <span className="absolute top-2 right-2 text-[10px] font-mono px-2 py-0.5 rounded bg-background/70 backdrop-blur border border-border/60">
            MC {cheat.mc_version}
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-foreground group-hover:neon-text transition">{cheat.title}</h3>
        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{cheat.short_description}</p>
        <div className="mt-3 flex flex-wrap gap-1">
          {cheat.tags.slice(0, 3).map((t) => (
            <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary border border-border/60 text-muted-foreground">#{t}</span>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Download className="h-3.5 w-3.5" />{cheat.downloads.toLocaleString()}</span>
          {cheat.rating != null && (
            <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-accent text-accent" />{cheat.rating.toFixed(1)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
