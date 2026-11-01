import { ArrowRight, Github } from "lucide-react";
import { GITHUB_URL } from "./links";

/** Deterministic pseudo-telemetry series for the static preview graphs. */
function series(seed: number, n = 40) {
  return Array.from({ length: n }, (_, i) => 0.5 + 0.28 * Math.sin(i * 0.45 + seed) + 0.12 * Math.sin(i * 1.7 + seed * 2));
}

function Sparkline({ seed, className }: { seed: number; className?: string }) {
  const pts = series(seed);
  const w = 240;
  const h = 56;
  const d = pts.map((v, i) => `${(i / (pts.length - 1)) * w},${h - v * h}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className={className} aria-hidden>
      <polygon points={`0,${h} ${d} ${w},${h}`} className="fill-primary/10" />
      <polyline points={d} fill="none" strokeWidth="1.5" vectorEffect="non-scaling-stroke" className="stroke-primary" />
    </svg>
  );
}

const vitals = [
  { label: "CPU-to-GPU Latency", value: "0.40", unit: "ms", seed: 1 },
  { label: "Mmap Bandwidth", value: "12.1", unit: "GB/s", seed: 2.4 },
  { label: "Cache Hit", value: "94.5", unit: "%", seed: 4.1 },
];

const bars = [62, 74, 58, 81, 69, 88, 77, 92, 71, 84, 79, 90, 66, 86, 73, 95, 82, 78, 89, 93];

function PreviewCard() {
  return (
    <div className="relative mx-auto mt-16 max-w-5xl">
      <div className="absolute -inset-x-10 -top-10 bottom-0 -z-10 rounded-[2rem] bg-primary/5 blur-3xl" />
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-2xl shadow-background">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <span className="size-2.5 rounded-full bg-border" />
          <span className="size-2.5 rounded-full bg-border" />
          <span className="size-2.5 rounded-full bg-border" />
          <span className="ml-3 font-mono text-xs text-muted-foreground">nsx://workstation-01/telemetry</span>
          <span className="ml-auto flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
            <span className="size-1.5 animate-pulse rounded-full bg-primary" /> streaming
          </span>
        </div>

        <div className="grid gap-px bg-border sm:grid-cols-3">
          {vitals.map((v) => (
            <div key={v.label} className="bg-card p-5 text-left">
              <p className="text-xs text-muted-foreground">{v.label}</p>
              <p className="mt-2 font-mono text-3xl font-medium tabular-nums tracking-tight">
                {v.value}
                <span className="ml-1 text-sm text-muted-foreground">{v.unit}</span>
              </p>
              <Sparkline seed={v.seed} className="mt-4 h-12 w-full" />
            </div>
          ))}
        </div>

        <div className="grid gap-px border-t border-border bg-border md:grid-cols-[1.4fr_1fr]">
          <div className="bg-card p-5 text-left">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Batch ingest throughput</span>
              <span className="font-mono">last 20 windows</span>
            </div>
            <div className="mt-4 flex h-28 items-end gap-1.5">
              {bars.map((b, i) => (
                <span key={i} className="flex-1 rounded-sm bg-primary/25" style={{ height: `${b}%` }} />
              ))}
            </div>
          </div>
          <div className="bg-terminal p-5 text-left font-mono text-[11px] leading-relaxed">
            <p><span className="text-muted-foreground">12:10:00.052</span> <span className="text-primary">[INFO]</span> mmap buffer @ 0x7fff3a2c0000</p>
            <p><span className="text-muted-foreground">12:10:00.311</span> <span className="text-muted-foreground">[DEBUG]</span> Batch #142 ingested 0.40 ms</p>
            <p><span className="text-muted-foreground">12:10:00.488</span> <span className="text-muted-foreground">[DEBUG]</span> page cache hit 94.5%</p>
            <p><span className="text-muted-foreground">12:10:00.902</span> <span className="text-primary">[INFO]</span> zero-copy bypass active</p>
            <p><span className="text-muted-foreground">12:10:01.240</span> <span className="text-muted-foreground">[DEBUG]</span> Batch #143 ingested 0.41 ms</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden px-5 pb-24 pt-20 text-center sm:pt-28">
      <div className="grid-lines pointer-events-none absolute inset-0 -z-10" />
      <a
        href="#architecture"
        className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3.5 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <span className="rounded-full bg-primary/15 px-2 py-0.5 font-mono text-[10px] text-primary">v1.2</span>
        Kernel-Space Bypass Released
        <ArrowRight className="size-3.5" />
      </a>

      <h1 className="mx-auto mt-8 max-w-4xl text-5xl font-semibold leading-[1.02] tracking-[-0.04em] sm:text-7xl">
        Act fast when hardware bottlenecks arise.
      </h1>
      <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
        Complete zero-copy, memory-mapped (mmap) streaming framework for local foundation model fine-tuning and
        high-density MLSys execution.
      </p>

      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <a
          href="#documentation"
          className="rounded-md bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          View Documentation
        </a>
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 rounded-md border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-card"
        >
          <Github className="size-4" /> Explore GitHub
        </a>
      </div>

      <PreviewCard />
    </section>
  );
}
