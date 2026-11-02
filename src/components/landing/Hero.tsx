import { ArrowRight, Github } from "lucide-react";
import { useEffect, useState } from "react";
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

const initialBars = [62, 74, 58, 81, 69, 88, 77, 92, 71, 84, 79, 90, 66, 86, 73, 95, 82, 78, 89, 93];

function PreviewCard() {
  const [tick, setTick] = useState(0);
  const [latency, setLatency] = useState(0.4);
  const [bandwidth, setBandwidth] = useState(12.1);
  const [cacheHit, setCacheHit] = useState(94.5);
  const [bars, setBars] = useState<number[]>(initialBars);
  const [batchNum, setBatchNum] = useState(144);
  const [logs, setLogs] = useState([
    { time: "12:10:00.052", level: "INFO", text: "mmap buffer @ 0x7fff3a2c0000" },
    { time: "12:10:00.311", level: "DEBUG", text: "Batch #142 ingested 0.40 ms" },
    { time: "12:10:00.488", level: "DEBUG", text: "page cache hit 94.5%" },
    { time: "12:10:00.902", level: "INFO", text: "zero-copy bypass active" },
    { time: "12:10:01.240", level: "DEBUG", text: "Batch #143 ingested 0.41 ms" },
  ]);

  // Periodic live telemetry simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 0.3);
      const newLatency = Number((0.39 + Math.random() * 0.03).toFixed(2));
      const newBandwidth = Number((11.9 + Math.random() * 0.5).toFixed(1));
      const newCache = Number((94.2 + Math.random() * 0.7).toFixed(1));
      setLatency(newLatency);
      setBandwidth(newBandwidth);
      setCacheHit(newCache);

      // Slide bars
      setBars((prev) => {
        const nextVal = Math.floor(65 + Math.random() * 32);
        return [...prev.slice(1), nextVal];
      });

      // Append live batch log
      setBatchNum((b) => {
        const nextB = b + 1;
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}.${String(now.getMilliseconds()).padStart(3, "0")}`;
        setLogs((prev) => [
          ...prev.slice(1),
          { time: timeStr, level: "DEBUG", text: `Batch #${nextB} ingested ${newLatency.toFixed(2)} ms` },
        ]);
        return nextB;
      });
    }, 1600);

    return () => clearInterval(interval);
  }, []);

  const vitals = [
    { label: "CPU-to-GPU Latency", value: latency.toFixed(2), unit: "ms", seed: 1 + tick },
    { label: "Mmap Bandwidth", value: bandwidth.toFixed(1), unit: "GB/s", seed: 2.4 + tick },
    { label: "Cache Hit", value: cacheHit.toFixed(1), unit: "%", seed: 4.1 + tick },
  ];

  return (
    <div className="relative mx-auto mt-16 max-w-5xl">
      <div className="telemetry-card overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex items-center gap-2 border-b border-border bg-secondary/40 px-4 py-3">
          <span className="size-2.5 rounded-full bg-border" />
          <span className="size-2.5 rounded-full bg-border" />
          <span className="size-2.5 rounded-full bg-border" />
          <span className="ml-3 font-mono text-xs text-muted-foreground">nsx://workstation-01/telemetry</span>
          <span className="ml-auto flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
            <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" /> live telemetry
          </span>
        </div>

        <div className="grid gap-px bg-border sm:grid-cols-3">
          {vitals.map((v) => (
            <div key={v.label} className="bg-card p-5 text-left transition-colors hover:bg-secondary/30">
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
              <span className="font-mono text-primary font-medium">streaming window</span>
            </div>
            <div className="mt-4 flex h-28 items-end gap-1.5">
              {bars.map((b, i) => (
                <span
                  key={i}
                  className="flex-1 rounded-sm bg-primary/25 transition-all duration-300 hover:bg-primary/50"
                  style={{ height: `${b}%` }}
                />
              ))}
            </div>
          </div>
          <div className="bg-terminal p-5 text-left font-mono text-[11px] leading-relaxed text-slate-100">
            {logs.map((log, i) => (
              <p key={i}>
                <span className="text-slate-400">{log.time}</span>{" "}
                <span className={log.level === "INFO" ? "text-primary font-bold" : "text-slate-400 font-semibold"}>
                  [{log.level}]
                </span>{" "}
                {log.text}
              </p>
            ))}
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
        className="animate-fade-in inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3.5 py-1.5 text-xs text-muted-foreground transition-all duration-200 hover:text-foreground hover:border-primary/40 hover:bg-card"
      >
        <span className="rounded-full bg-primary/15 px-2 py-0.5 font-mono text-[10px] text-primary">v1.2</span>
        Kernel-Space Bypass Released
        <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
      </a>

      <h1 className="animate-fade-up delay-100 mx-auto mt-8 max-w-4xl text-5xl font-semibold leading-[1.02] tracking-[-0.04em] sm:text-7xl">
        Act fast when hardware bottlenecks arise.
      </h1>
      <p className="animate-fade-up delay-200 mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
        Complete zero-copy, memory-mapped (mmap) streaming framework for local foundation model fine-tuning and
        high-density MLSys execution.
      </p>

      <div className="animate-fade-up delay-300 mt-10 flex flex-wrap justify-center gap-3">
        <a
          href="#documentation"
          className="btn-press rounded-md bg-foreground px-5 py-2.5 text-sm font-medium text-background"
        >
          View Documentation
        </a>
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noreferrer"
          className="btn-press flex items-center gap-2 rounded-md border border-border px-5 py-2.5 text-sm font-medium transition-colors duration-200 hover:bg-card hover:border-primary/40"
        >
          <Github className="size-4" /> Explore GitHub
        </a>
      </div>

      <div className="animate-fade-up delay-500 animate-float">
        <PreviewCard />
      </div>
    </section>
  );
}
