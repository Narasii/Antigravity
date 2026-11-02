import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, useMemo } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Cpu,
  Database,
  Gauge,
  Pause,
  Play,
  RefreshCw,
  Terminal,
  Trash2,
  Zap,
  Download,
  FileText,
  Search,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import {
  clampControl,
  controls,
  defaultConfig,
  initialLogs,
  initialMetrics,
  nextMetrics,
  streamLog,
  timestamp,
  type ControlSpec,
  type LogLine,
  type Metrics,
  type PipelineConfig,
  type StreamState,
} from "@/components/dashboard/data";
import { cn } from "@/lib/utils";
import { GuideBanner } from "@/components/dashboard/GuideBanner";
import { InfoTip } from "@/components/dashboard/InfoTip";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Live Demo Dashboard — NeuroStream-X" },
      {
        name: "description",
        content: "Live CPU-to-GPU latency, zero-copy mmap bandwidth, cache hit ratio and kernel logs for NeuroStream-X.",
      },
      { property: "og:title", content: "Live Demo Dashboard — NeuroStream-X" },
      {
        property: "og:description",
        content: "Live CPU-to-GPU latency, zero-copy mmap bandwidth, cache hit ratio and kernel logs for NeuroStream-X.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

const MAX_LOGS = 250;

function Panel({ className, children }: { className?: string; children: React.ReactNode }) {
  return <section className={cn("glass telemetry-card rounded-2xl", className)}>{children}</section>;
}

function MetricCard({
  icon: Icon,
  label,
  value,
  unit,
  paused,
  flash,
  info,
  accent = "primary",
}: {
  icon: typeof Cpu;
  label: string;
  value: string;
  unit: string;
  paused: boolean;
  flash: boolean;
  info: string;
  accent?: "primary" | "memory";
}) {
  return (
    <Panel className={cn("p-6 transition-[border-color,box-shadow] duration-500", flash && "border-primary/40")}>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-2">
          <Icon className={cn("size-4", accent === "memory" ? "text-memory" : "text-primary/80")} /> {label}
          <InfoTip title={label}>{info}</InfoTip>
        </span>
        <span
          className={cn(
            "size-1.5 rounded-full transition-colors duration-500",
            paused ? "bg-warning" : accent === "memory" ? "bg-memory" : "bg-primary",
          )}
        />
      </div>
      <p className={cn("mt-6 font-mono text-4xl font-medium tabular-nums tracking-tight transition-opacity duration-500", paused && "opacity-60")}>
        {value}
        <span className="ml-1.5 text-base text-muted-foreground">{unit}</span>
      </p>
    </Panel>
  );
}

function formatLr(v: number) {
  return v.toExponential(1);
}

function ControlRow({
  spec,
  value,
  onChange,
}: {
  spec: ControlSpec;
  value: number;
  onChange: (v: number) => void;
}) {
  const isLr = spec.key === "learningRate";
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);

  // Learning rate spans three decades, so its slider runs on log10.
  const sliderMin = isLr ? Math.log10(spec.min) : spec.min;
  const sliderMax = isLr ? Math.log10(spec.max) : spec.max;
  const sliderStep = isLr ? 0.01 : spec.step;
  const sliderValue = isLr ? Math.log10(value) : value;

  const commit = () => {
    const next = clampControl(spec, Number(draft));
    onChange(next);
    setDraft(String(next));
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={spec.key} className="text-sm font-medium">
          {spec.label}
        </label>
        <div className="flex items-center gap-2">
          <input
            id={spec.key}
            inputMode="decimal"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => e.key === "Enter" && commit()}
            className="w-24 rounded-md border border-input bg-background px-2 py-1 text-right font-mono text-sm tabular-nums outline-none focus:border-primary"
          />
          {spec.unit && <span className="w-14 font-mono text-xs text-muted-foreground">{spec.unit}</span>}
          {!spec.unit && <span className="w-14 font-mono text-xs text-muted-foreground">{formatLr(value)}</span>}
        </div>
      </div>
      <Slider
        className="mt-3"
        aria-label={spec.label}
        min={sliderMin}
        max={sliderMax}
        step={sliderStep}
        value={[sliderValue]}
        onValueChange={([v = sliderValue]) => onChange(clampControl(spec, isLr ? 10 ** v : v))}
      />
      <div className="mt-1.5 flex justify-between font-mono text-[11px] text-muted-foreground">
        <span>{isLr ? formatLr(spec.min) : spec.min}</span>
        <span>{isLr ? formatLr(spec.max) : spec.max}</span>
      </div>
    </div>
  );
}

const levelClass: Record<string, string> = {
  INFO: "font-bold text-[#0284C7]",
  SUCCESS: "font-bold text-[#059669]",
  WARN: "font-bold text-[#D97706]",
  ERROR: "font-bold text-[#DC2626]",
  DEBUG: "font-semibold text-[#64748B]",
};

function Dashboard() {
  const [state, setState] = useState<StreamState>("active");
  const [metrics, setMetrics] = useState<Metrics>(initialMetrics);
  const [refreshing, setRefreshing] = useState(false);
  const [flash, setFlash] = useState(false);
  const [draft, setDraft] = useState<PipelineConfig>(defaultConfig);
  const [applied, setApplied] = useState<PipelineConfig>(defaultConfig);
  const [logs, setLogs] = useState<LogLine[]>(() => initialLogs.map((l, i) => ({ ...l, id: i })));
  const [logFilter, setLogFilter] = useState<"ALL" | "INFO" | "WARN" | "DEBUG">("ALL");
  const [logSearch, setLogSearch] = useState("");
  const nextId = useRef(initialLogs.length);
  const batch = useRef(143);
  const termRef = useRef<HTMLDivElement>(null);
  const metricsRef = useRef(metrics);
  metricsRef.current = metrics;

  const active = state === "active";
  const dirty = (Object.keys(draft) as (keyof PipelineConfig)[]).some((k) => draft[k] !== applied[k]);

  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      if (logFilter !== "ALL" && l.level !== logFilter) return false;
      if (logSearch.trim()) {
        const q = logSearch.toLowerCase();
        return l.text.toLowerCase().includes(q) || l.level.toLowerCase().includes(q);
      }
      return true;
    });
  }, [logs, logFilter, logSearch]);

  const exportTelemetry = () => {
    const data = {
      timestamp: new Date().toISOString(),
      workstation: "Workstation-01",
      streamState: state,
      metrics: {
        latencyMs: metrics.latency,
        bandwidthGbps: metrics.bandwidth,
        cacheHitPct: metrics.cacheHit,
      },
      pipelineConfig: applied,
      logs: logs.map(({ time, level, text }) => ({ time, level, text })),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nsx-telemetry-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Telemetry log exported as JSON");
  };

  const copySnapshotReport = async () => {
    const report = [
      `### NeuroStream-X MLSys Telemetry Snapshot`,
      `- **Generated**: ${new Date().toLocaleString()}`,
      `- **Status**: ${active ? "Streaming (Active)" : "Paused"}`,
      `- **CPU-to-GPU Latency**: ${metrics.latency.toFixed(2)} ms`,
      `- **Mmap Read Bandwidth**: ${metrics.bandwidth.toFixed(1)} GB/s`,
      `- **Page Cache Hit**: ${metrics.cacheHit.toFixed(1)} %`,
      `- **Pipeline Config**: batch=${applied.batchSize} · chunkWindow=${applied.chunkWindow} MiB · lr=${formatLr(applied.learningRate)}`,
      `- **Kernel Logs Recorded**: ${logs.length} lines`,
      `*Zero-Copy memory-mapped DMA streaming bypass active.*`,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(report);
      toast.success("Benchmark snapshot report copied to clipboard");
    } catch {
      toast.error("Failed to copy report to clipboard");
    }
  };

  const log = (level: LogLine["level"], text: string) =>
    setLogs((ls) => [...ls, { id: nextId.current++, time: timestamp(), level, text }].slice(-MAX_LOGS));

  // Live metrics tick.
  useEffect(() => {
    const t = setInterval(() => setMetrics((m) => nextMetrics(m, applied, state)), 1000);
    return () => clearInterval(t);
  }, [applied, state]);

  // Kernel log stream, only while active.
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => {
      const { level, text } = streamLog(batch.current++, metricsRef.current);
      log(level, text);
    }, 1100);
    return () => clearInterval(t);
  }, [active]);

  useEffect(() => {
    const el = termRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [logs]);

  const toggleStream = () => {
    const next = active ? "paused" : "active";
    setState(next);
    setMetrics((m) => nextMetrics(m, applied, next));
    log(next === "active" ? "INFO" : "WARN", next === "active" ? "stream resumed — prefetch workers restarted" : "stream paused — mmap readers idle, buffers retained");
  };

  const refresh = () => {
    setRefreshing(true);
    log("DEBUG", "polling /proc/meminfo and nvml counters…");
    setTimeout(() => {
      setMetrics((m) => nextMetrics(m, applied, state));
      setRefreshing(false);
      setFlash(true);
      setTimeout(() => setFlash(false), 600);
      log("INFO", "telemetry snapshot refreshed");
    }, 900);
  };

  const applyConfig = () => {
    setApplied(draft);
    log(
      "INFO",
      `pipeline config compiled: batch=${draft.batchSize} window=${draft.chunkWindow}MiB lr=${formatLr(draft.learningRate)}`,
    );
    toast.success("Configuration compiled to local buffer successfully");
  };

  return (
    <main className="mx-auto min-h-screen max-w-4xl space-y-10 px-5 py-10 lg:py-16">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to site
      </Link>

      <GuideBanner />

      <header className="flex flex-wrap items-center gap-4">
        <div className="mr-auto">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            NeuroStream-X <span className="text-muted-foreground">// Local MLSys Telemetry</span>
          </h1>
          <p className="mt-1 font-mono text-xs text-muted-foreground">zero-copy mmap · pinned host ring · CUDA 12.4</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Snapshot Report Button */}
          <button
            onClick={copySnapshotReport}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary hover:border-slate-300 transition-colors"
            title="Copy formatted markdown telemetry report to clipboard"
          >
            <FileText className="size-3.5 text-primary" />
            <span className="hidden sm:inline">Snapshot</span>
          </button>

          {/* Export JSON Button */}
          <button
            onClick={exportTelemetry}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary hover:border-slate-300 transition-colors"
            title="Download telemetry and kernel log stream as JSON"
          >
            <Download className="size-3.5 text-primary" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <span
            className={cn(
              "flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-xs transition-colors duration-500",
              active ? "border-primary/40 bg-primary/10 text-primary" : "border-warning/40 bg-warning/10 text-warning",
            )}
          >
            <span className={cn("size-2 rounded-full", active ? "bg-primary animate-pulse" : "bg-warning")} />
            Workstation-01 [{active ? "Active" : "Paused"}]
          </span>
          <button
            onClick={toggleStream}
            aria-pressed={active}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors duration-500",
              active
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-warning text-warning-foreground hover:bg-warning/90",
            )}
          >
            {active ? <Pause className="size-4" /> : <Play className="size-4" />}
            {active ? "Active (Streaming)" : "Paused"}
          </button>
        </div>
      </header>

      <section>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Core telemetry</h2>
        <button
          onClick={refresh}
          disabled={refreshing}
          className="glass flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors hover:bg-accent disabled:opacity-60"
        >
          <RefreshCw className={cn("size-4", refreshing && "animate-spin")} />
          {refreshing ? "Fetching…" : "Refresh Telemetry"}
        </button>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <MetricCard icon={Cpu} label="CPU-to-GPU Latency" value={metrics.latency.toFixed(2)} unit="ms" paused={!active} flash={flash}
          info="How long one batch takes to travel from host memory to the GPU. Lower is better; bigger batches take longer per hop." />
        <MetricCard icon={Zap} label="Mmap Bandwidth" value={metrics.bandwidth.toFixed(1)} unit="GB/s" paused={!active} flash={flash} accent="memory"
          info="How much data per second is read straight from memory-mapped dataset files, without extra copies. It drops to zero while the stream is paused." />
        <MetricCard icon={Database} label="Cache Hit Ratio" value={metrics.cacheHit.toFixed(1)} unit="%" paused={!active} flash={flash}
          info="Share of requested data pages already sitting in RAM. A high ratio means the disk is rarely touched; a larger chunk window usually raises it." />
      </div>
      </section>

      <div className="space-y-10">
        <Panel className="flex flex-col p-6 sm:p-8">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Gauge className="size-4 text-muted-foreground" /> Local Fine-Tuning Controls
          </h2>
          <div className="mt-6 space-y-8">
            {controls.map((spec) => (
              <ControlRow
                key={spec.key}
                spec={spec}
                value={draft[spec.key]}
                onChange={(v) => setDraft((d) => ({ ...d, [spec.key]: v }))}
              />
            ))}
          </div>
          <div className="flex items-center gap-3 pt-8">
            <button
              onClick={applyConfig}
              className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Apply Pipeline Config
            </button>
            <button
              onClick={() => setDraft(applied)}
              disabled={!dirty}
              className="rounded-lg border border-border px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground disabled:opacity-40"
            >
              Revert
            </button>
          </div>
          <p className="mt-2 font-mono text-[11px] text-muted-foreground">
            {dirty ? "● unapplied changes" : "✓ in sync with local buffer"}
          </p>
        </Panel>

        <Panel className="flex flex-col overflow-hidden border border-[#CBD5E1] bg-[#F1F5F9] shadow-sm">
          {/* Terminal Control Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#CBD5E1] bg-card px-6 py-3.5">
            <div className="flex items-center gap-3">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-[#0F172A]">
                <Terminal className="size-4 text-[#475569]" /> Live Kernel Log
                <span className="font-mono text-xs font-normal text-[#64748B]">
                  {filteredLogs.length} / {logs.length} lines
                </span>
              </h2>

              {/* Level Filter Pills */}
              <div className="hidden items-center rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] p-0.5 text-xs font-medium sm:flex">
                {(["ALL", "INFO", "WARN", "DEBUG"] as const).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setLogFilter(lvl)}
                    className={`rounded-md px-2 py-0.5 font-mono text-[11px] transition-all ${
                      logFilter === lvl
                        ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                        : "text-[#64748B] hover:text-[#0F172A]"
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Quick Search Input */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-[#64748B]" />
                <input
                  type="text"
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  placeholder="Filter logs..."
                  className="w-28 sm:w-36 rounded-md border border-[#CBD5E1] bg-[#F8FAFC] pl-7 pr-2.5 py-1 text-xs text-[#0F172A] outline-hidden placeholder:text-[#94A3B8] focus:border-primary focus:w-44 transition-all"
                />
              </div>

              <button
                onClick={() => setLogs([])}
                className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs text-[#64748B] hover:bg-[#E2E8F0] hover:text-[#0F172A] transition-colors"
                title="Clear all recorded kernel logs"
              >
                <Trash2 className="size-3.5" /> Clear
              </button>
            </div>
          </div>

          <div
            ref={termRef}
            className="min-h-[240px] max-h-[380px] overflow-y-auto border-t border-[#CBD5E1] bg-[#F1F5F9] p-4 font-mono text-[14px] leading-relaxed text-[#0F172A] scrollbar-thin scrollbar-thumb-slate-400"
            style={{ fontFamily: '"JetBrains Mono", "Fira Code", ui-monospace, monospace', fontSize: "0.875rem" }}
          >
            {filteredLogs.length === 0 ? (
              <p className="text-[#64748B]">
                {logSearch || logFilter !== "ALL"
                  ? "no logs match current filter criteria"
                  : active
                    ? "waiting for kernel events…"
                    : "stream paused — no new events"}
              </p>
            ) : (
              filteredLogs.map((l) => (
                <p key={l.id} className="whitespace-pre-wrap break-words py-0.5 text-[#0F172A]">
                  <span className="text-[#64748B]">{l.time} </span>
                  <span className={levelClass[l.level] ?? "font-bold text-[#0284C7]"}>[{l.level}]</span>{" "}
                  <span className="text-[#0F172A]">{l.text}</span>
                </p>
              ))
            )}
            {active && <span className="inline-block h-3.5 w-2 animate-pulse bg-[#0284C7] align-middle ml-1" />}
          </div>
        </Panel>
      </div>
    </main>
  );
}
