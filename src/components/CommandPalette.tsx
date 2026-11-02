import { useEffect, useState, useMemo } from "react";
import { useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Search,
  Layers,
  Activity,
  BarChart3,
  BookOpen,
  Gauge,
  Github,
  Copy,
  Terminal,
  ExternalLink,
  X,
} from "lucide-react";
import { GITHUB_URL } from "./landing/links";

interface CommandItem {
  id: string;
  title: string;
  category: "Navigation" | "Action" | "Resources";
  shortcut?: string;
  icon: typeof Search;
  action: () => void;
}

export function CommandPalette({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();

  const commands: CommandItem[] = useMemo(
    () => [
      {
        id: "nav-arch",
        title: "Go to Architecture & Zero-Copy Pipeline",
        category: "Navigation",
        shortcut: "G A",
        icon: Layers,
        action: () => {
          onClose();
          if (window.location.pathname !== "/") {
            router.navigate({ to: "/" }).then(() => {
              window.location.hash = "#architecture";
            });
          } else {
            window.location.hash = "#architecture";
          }
        },
      },
      {
        id: "nav-telemetry",
        title: "Go to Telemetry Playground",
        category: "Navigation",
        shortcut: "G T",
        icon: Activity,
        action: () => {
          onClose();
          if (window.location.pathname !== "/") {
            router.navigate({ to: "/" }).then(() => {
              window.location.hash = "#telemetry";
            });
          } else {
            window.location.hash = "#telemetry";
          }
        },
      },
      {
        id: "nav-bench",
        title: "Go to Hardware Benchmarks & Calculator",
        category: "Navigation",
        shortcut: "G B",
        icon: BarChart3,
        action: () => {
          onClose();
          if (window.location.pathname !== "/") {
            router.navigate({ to: "/" }).then(() => {
              window.location.hash = "#benchmarks";
            });
          } else {
            window.location.hash = "#benchmarks";
          }
        },
      },
      {
        id: "nav-docs",
        title: "Go to Quickstart Documentation",
        category: "Navigation",
        shortcut: "G D",
        icon: BookOpen,
        action: () => {
          onClose();
          if (window.location.pathname !== "/") {
            router.navigate({ to: "/" }).then(() => {
              window.location.hash = "#documentation";
            });
          } else {
            window.location.hash = "#documentation";
          }
        },
      },
      {
        id: "nav-dashboard",
        title: "Launch Live Kernel Dashboard",
        category: "Navigation",
        shortcut: "G L",
        icon: Gauge,
        action: () => {
          onClose();
          router.navigate({ to: "/dashboard" });
        },
      },
      {
        id: "act-copy-python",
        title: "Copy Python Quickstart Code",
        category: "Action",
        icon: Copy,
        action: () => {
          onClose();
          const code = `pip install neurostream-x\n\nfrom neurostream import StreamPipeline\n\npipe = StreamPipeline("data/shards", batch_size=128, chunk_window_mb=64)\nfor batch in pipe:\n    train_step(batch)`;
          navigator.clipboard.writeText(code);
          toast.success("Python quickstart snippet copied to clipboard");
        },
      },
      {
        id: "act-copy-clone",
        title: "Copy Git Clone Command",
        category: "Action",
        icon: Terminal,
        action: () => {
          onClose();
          navigator.clipboard.writeText("git clone https://github.com/Narasii/Antigravity.git");
          toast.success("Git clone command copied to clipboard");
        },
      },
      {
        id: "res-github",
        title: "Open GitHub Repository (Narasii/Antigravity)",
        category: "Resources",
        icon: Github,
        action: () => {
          onClose();
          window.open(GITHUB_URL, "_blank");
        },
      },
    ],
    [onClose, router]
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter(
      (c) => c.title.toLowerCase().includes(q) || c.category.toLowerCase().includes(q)
    );
  }, [commands, query]);

  // Handle keyboard navigation inside command list
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % (filtered.length || 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + filtered.length) % (filtered.length || 1));
      } else if (e.key === "Enter" && filtered[selectedIndex]) {
        e.preventDefault();
        filtered[selectedIndex]!.action();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose, filtered, selectedIndex]);

  // Reset selectedIndex on search change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-start justify-center p-4 pt-20 sm:pt-28"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Palette Box */}
      <div className="relative w-full max-w-xl overflow-hidden rounded-xl border border-border bg-card shadow-2xl transition-all animate-fade-up">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3.5 bg-secondary/20">
          <Search className="size-4 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or jump to section..."
            className="flex-1 bg-transparent font-sans text-sm text-foreground outline-hidden placeholder:text-muted-foreground"
            autoFocus
          />
          <kbd className="hidden rounded border border-border bg-card px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline-block">
            ESC
          </kbd>
          <button
            onClick={onClose}
            className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground sm:hidden"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Command Items List */}
        <div className="max-h-80 overflow-y-auto p-2 scrollbar-thin">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground font-mono">
              No matching commands found.
            </div>
          ) : (
            filtered.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                    isSelected ? "bg-primary/10 text-primary font-medium" : "text-foreground hover:bg-secondary/60"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`size-4 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                    <span>{item.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-muted-foreground uppercase">
                      {item.category}
                    </span>
                    {item.shortcut && (
                      <kbd className="hidden rounded border border-border bg-card px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline-block">
                        {item.shortcut}
                      </kbd>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer Navigation Hints */}
        <div className="flex items-center justify-between border-t border-border bg-secondary/40 px-4 py-2 text-[11px] font-mono text-muted-foreground">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
          </div>
          <span>NeuroStream-X HUD</span>
        </div>
      </div>
    </div>
  );
}
