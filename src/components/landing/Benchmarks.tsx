import { useEffect, useRef } from "react";
import { HardwareCalculator } from "./HardwareCalculator";

const rows = [
  { metric: "CPU-to-GPU latency (per batch)", baseline: "1.12 ms", nsx: "0.40 ms" },
  { metric: "Sustained read bandwidth", baseline: "4.3 GB/s", nsx: "12.1 GB/s" },
  { metric: "Page-cache hit ratio", baseline: "71.0 %", nsx: "94.5 %" },
  { metric: "Host memory copies per batch", baseline: "2", nsx: "0" },
];

export function Benchmarks() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const els = sectionRef.current?.querySelectorAll(".reveal, .reveal-left");
    if (!els) return;
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("visible"); observer.unobserve(e.target); } }),
      { threshold: 0.12 }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section id="benchmarks" className="scroll-mt-20 border-t border-border px-5 py-28" ref={sectionRef}>
      <div className="mx-auto max-w-6xl">
        <p className="reveal-left font-mono text-xs uppercase tracking-[0.2em] text-primary">Benchmarks</p>
        <h2 className="reveal mt-4 max-w-2xl text-4xl font-semibold tracking-[-0.03em] sm:text-5xl" style={{ transitionDelay: "80ms" }}>Fewer copies, shorter paths.</h2>
        <p className="reveal mt-5 max-w-2xl text-lg text-muted-foreground" style={{ transitionDelay: "160ms" }}>
          A standard copy-based data loader against NeuroStream-X on a single local workstation.
        </p>

        <div
          className="reveal telemetry-card mt-14 overflow-x-auto rounded-xl border border-border bg-card shadow-sm hover:scale-[1.01] hover:shadow-md transition-all duration-300"
          style={{ transitionDelay: "240ms" }}
        >
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="bg-secondary/40 text-xs text-muted-foreground border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium">Metric</th>
                <th className="px-6 py-4 font-medium">Copy-based loader</th>
                <th className="px-6 py-4 font-medium text-foreground">NeuroStream-X</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((r, i) => (
                <tr
                  key={r.metric}
                  className="reveal transition-colors duration-150 hover:bg-secondary/40"
                  style={{ transitionDelay: `${320 + i * 60}ms` }}
                >
                  <td className="px-6 py-4 font-medium text-foreground">{r.metric}</td>
                  <td className="px-6 py-4 font-mono tabular-nums text-muted-foreground">{r.baseline}</td>
                  <td className="px-6 py-4 font-mono tabular-nums font-semibold text-primary">{r.nsx}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 font-mono text-[11px] text-muted-foreground">
          Simulated reference profile · replace with measured results before publication.
        </p>

        {/* ── Interactive ROI / Hardware Calculator ── */}
        <div className="reveal mt-10" style={{ transitionDelay: "380ms" }}>
          <HardwareCalculator />
        </div>
      </div>
    </section>
  );
}

