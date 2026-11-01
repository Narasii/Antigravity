import { Link } from "@tanstack/react-router";
import { GITHUB_URL, sectionLinks } from "./links";

export function SiteFooter() {
  return (
    <footer className="border-t border-border px-5 py-16">
      <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <p className="flex items-center gap-2.5">
            <span className="grid size-7 place-items-center rounded-md border border-border bg-card font-mono text-[11px] text-primary">NX</span>
            <span className="font-semibold tracking-tight">NeuroStream-X</span>
          </p>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Maintained by Narasiimhan S N — Undergraduate Researcher, IIM Sambalpur &amp; IIT Madras.
          </p>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Product</p>
          <ul className="mt-4 space-y-2.5 text-sm">
            {sectionLinks.map((l) => (
              <li key={l.id}>
                <a href={`#${l.id}`} className="text-muted-foreground transition-colors hover:text-foreground">{l.label}</a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Resources</p>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link to="/dashboard" className="text-muted-foreground transition-colors hover:text-foreground">Live Demo</Link></li>
            <li><a href={GITHUB_URL} target="_blank" rel="noreferrer" className="text-muted-foreground transition-colors hover:text-foreground">GitHub</a></li>
          </ul>
        </div>
      </div>

      <div className="mx-auto mt-14 flex max-w-6xl flex-wrap justify-between gap-3 border-t border-border pt-8 font-mono text-xs text-muted-foreground">
        <span>© 2026 NeuroStream-X. Released under the MIT License.</span>
        <span>Zero-copy · memory-mapped · local-first</span>
      </div>
    </footer>
  );
}
