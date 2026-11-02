import { Link } from "@tanstack/react-router";
import { Github, Menu, Search, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { GITHUB_URL, sectionLinks } from "./links";

export function SiteNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-5">
        <a href="#top" className="flex items-center gap-2.5">
          <span className="grid size-7 place-items-center rounded-md border border-border bg-card font-mono text-[11px] font-medium text-primary">
            NX
          </span>
          <span className="text-[15px] font-semibold tracking-tight">NeuroStream-X</span>
          <span className="hidden rounded border border-border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground sm:inline">
            MLSys
          </span>
        </a>

        <ul className="mx-auto hidden items-center gap-1 md:flex">
          {sectionLinks.map((l) => (
            <li key={l.id}>
              <a
                href={`#${l.id}`}
                className="group relative rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
              >
                {l.label}
                <span className="absolute inset-x-3 bottom-1 h-px scale-x-0 rounded-full bg-primary transition-transform duration-200 group-hover:scale-x-100" />
              </a>
            </li>
          ))}
        </ul>

        <div className="ml-auto hidden items-center gap-2.5 md:ml-0 md:flex">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("open-command-palette"))}
            className="flex items-center gap-2 rounded-md border border-border bg-secondary/50 px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-slate-300 hover:text-foreground hover:bg-secondary"
            title="Open Command Palette (Cmd + K)"
          >
            <Search className="size-3.5" />
            <span className="hidden lg:inline">Search & Actions</span>
            <kbd className="rounded border border-border bg-card px-1.5 py-0.5 font-mono text-[10px]">
              ⌘K
            </kbd>
          </button>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground hover:bg-card"
          >
            <Github className="size-4" /> GitHub
          </a>
          <Link
            to="/dashboard"
            className="btn-press rounded-md bg-foreground px-3.5 py-2 text-sm font-medium text-background"
          >
            Launch Demo
          </Link>
        </div>

        <button
          className="ml-auto rounded-md p-2 text-muted-foreground hover:text-foreground md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </nav>

      <div className={cn("border-t border-border px-5 py-4 md:hidden", !open && "hidden")}>
        <button
          onClick={() => {
            setOpen(false);
            window.dispatchEvent(new CustomEvent("open-command-palette"));
          }}
          className="mb-3 flex w-full items-center justify-between rounded-md border border-border bg-secondary/50 px-3 py-2 text-xs text-muted-foreground"
        >
          <span className="flex items-center gap-2">
            <Search className="size-3.5" /> Search commands...
          </span>
          <kbd className="rounded border border-border bg-card px-1.5 py-0.5 font-mono text-[10px]">
            ⌘K
          </kbd>
        </button>
        <ul className="space-y-1">
          {sectionLinks.map((l) => (
            <li key={l.id}>
              <a href={`#${l.id}`} onClick={() => setOpen(false)} className="block py-2 text-sm text-muted-foreground">
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex gap-2">
          <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="flex-1 rounded-md border border-border py-2 text-center text-sm">
            GitHub
          </a>
          <Link to="/dashboard" className="flex-1 rounded-md bg-foreground py-2 text-center text-sm font-medium text-background">
            Launch Demo
          </Link>
        </div>
      </div>
    </header>
  );
}
