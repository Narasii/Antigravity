import { Check, Cpu, Database, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Slider } from "@/components/ui/slider";
import { clampControl, controls, defaultConfig, targetMetrics, type PipelineConfig } from "@/components/dashboard/data";
import { cn } from "@/lib/utils";

const demoControls = controls.filter((c) => c.key === "batchSize" || c.key === "chunkWindow");

export function TelemetryDemo() {
  const [draft, setDraft] = useState<PipelineConfig>(defaultConfig);
  const [applied, setApplied] = useState<PipelineConfig>(defaultConfig);
  const sectionRef = useRef<HTMLElement>(null);
  const m = targetMetrics(draft);
  const dirty = draft.batchSize !== applied.batchSize || draft.chunkWindow !== applied.chunkWindow;

  useEffect(() => {
    const els = sectionRef.current?.querySelectorAll(".reveal, .reveal-left");
    if (!els) return;
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            observer.unobserve(e.target);
          }
        }),
      { threshold: 0.12 }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const readouts = [
    { icon: Cpu, label: "CPU-to-GPU Latency", value: m.latency.toFixed(2), unit: "ms", pct: Math.min(100, (m.latency / 2.2) * 100) },
    { icon: Zap, label: "Mmap Bandwidth", value: m.bandwidth.toFixed(1), unit: "GB/s", pct: Math.min(100, (m.bandwidth / 14) * 100) },
    { icon: Database, label: "Cache Hit", value: m.cacheHit.toFixed(1), unit: "%", pct: m.cacheHit },
  ];

  const apply = () => {
    setApplied(draft);
    toast.success("Configuration compiled to local buffer successfully", {
      description: `batch=${draft.batchSize} · window=${draft.chunkWindow} MiB`,
    });
  };

  return (
    <section id="telemetry" className="scroll-mt-20 border-t border-border px-5 py-28" ref={sectionRef}>
      <div className="mx-auto max-w-6xl">
        <p className="reveal-left font-mono text-xs uppercase tracking-[0.2em] text-primary">Telemetry</p>
        <h2 className="reveal mt-4 max-w-2xl text-4xl font-semibold tracking-[-0.03em] sm:text-5xl" style={{ transitionDelay: "80ms" }}>
          Tune the pipeline. Watch it respond.
        </h2>
        <p className="reveal mt-5 max-w-2xl text-lg text-muted-foreground" style={{ transitionDelay: "160ms" }}>
          Drag the sliders to see how batch size and chunk window shift the steady-state vitals. Figures are simulated.
        </p>

        <div
          className="reveal telemetry-card mt-14 grid overflow-hidden rounded-xl border border-border bg-card shadow-sm hover:scale-[1.01] hover:shadow-md lg:grid-cols-[1fr_1.1fr]"
          style={{ transitionDelay: "220ms" }}
        >
          <div className="space-y-10 border-b border-border p-8 lg:border-b-0 lg:border-r">
            {demoControls.map((spec) => (
              <div key={spec.key}>
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-medium">{spec.label}</span>
                  <span className="font-mono text-sm tabular-nums">
                    {draft[spec.key]} <span className="text-muted-foreground">{spec.unit}</span>
                  </span>
                </div>
                <Slider
                  className="mt-4"
                  aria-label={spec.label}
                  min={spec.min}
                  max={spec.max}
                  step={spec.step}
                  value={[draft[spec.key]]}
                  onValueChange={([v = draft[spec.key]]) => setDraft((d) => ({ ...d, [spec.key]: clampControl(spec, v) }))}
                />
                <div className="mt-2 flex justify-between font-mono text-[11px] text-muted-foreground">
                  <span>{spec.min}</span>
                  <span>{spec.max}</span>
                </div>
              </div>
            ))}

            <div className="flex items-center gap-3">
              <button
                onClick={apply}
                className="flex-1 rounded-md bg-foreground py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
              >
                Apply Pipeline Config
              </button>
              <button
                onClick={() => setDraft(applied)}
                disabled={!dirty}
                className="rounded-md border border-border px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
              >
                Revert
              </button>
            </div>
            <p className={cn("flex items-center gap-1.5 font-mono text-[11px]", dirty ? "text-warning" : "text-muted-foreground")}>
              {dirty ? "● unapplied changes" : (<><Check className="size-3" /> in sync with local buffer</>)}
            </p>
          </div>

          <div className="divide-y divide-border">
            {readouts.map((r) => (
              <div key={r.label} className="p-8">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <r.icon className="size-4 text-primary" /> {r.label}
                </div>
                <p className="mt-3 font-mono text-4xl font-medium tabular-nums tracking-tight">
                  {r.value}
                  <span className="ml-1.5 text-base text-muted-foreground">{r.unit}</span>
                </p>
                <div className="mt-4 h-1 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${r.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
