import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/60 mt-24">
      <div className="container mx-auto px-4 py-10 grid gap-8 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 font-bold">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent grid place-items-center">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="neon-text">DonutVault</span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground max-w-xs">
            The premium client library for DonutsMP — curated, tested, and lightning-fast.
          </p>
        </div>
        <div>
          <div className="text-sm font-semibold mb-3">Explore</div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/library">Library</Link></li>
            <li><Link to="/announcements">News</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-sm font-semibold mb-3">Categories</div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Combat</li><li>Movement</li><li>Visuals</li><li>Utility</li>
          </ul>
        </div>
        <div>
          <div className="text-sm font-semibold mb-3">Legal</div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Terms</li><li>Privacy</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} DonutVault. Use at your own risk.
      </div>
    </footer>
  );
}
