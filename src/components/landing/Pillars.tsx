import { Activity, Cpu, HardDrive, Layers } from "lucide-react";
import { useEffect, useRef } from "react";

const pillars = [
  {
    icon: Layers,
    title: "Zero-Copy Ingestion",
    body: "Dataset shards are memory-mapped straight into the training process, so batches reach pinned host memory without a single intermediate copy.",
    tag: "mmap · MADV_SEQUENTIAL",
  },
  {
    icon: Cpu,
    title: "Kernel Bypass",
    body: "Hot paths skip redundant syscalls and user-space buffering, cutting the time between disk page and GPU tensor.",
    tag: "pinned ring · cudaHostRegister",
  },
  {
    icon: HardDrive,
    title: "Local Workstation Optimization",
    body: "NUMA-aware placement and chunk-window tuning get the most out of a single machine before you ever need a cluster.",
    tag: "NUMA · NVMe · page cache",
  },
  {
    icon: Activity,
    title: "Real-Time Telemetry",
    body: "Latency, bandwidth and cache hit ratio stream live, so a bottleneck shows up the moment it forms.",
    tag: "1 s sampling · kernel log",
  },
];

export function Pillars() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const els = sectionRef.current?.querySelectorAll(".reveal, .reveal-left");
    if (!els) return;
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("visible"); observer.unobserve(e.target); } }),
      { threshold: 0.15 }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section id="architecture" className="scroll-mt-20 px-5 py-28" ref={sectionRef}>
      <div className="mx-auto max-w-6xl">
        <p className="reveal-left font-mono text-xs uppercase tracking-[0.2em] text-primary">Architecture</p>
        <h2 className="reveal mt-4 max-w-2xl text-4xl font-semibold tracking-[-0.03em] sm:text-5xl" style={{ transitionDelay: "80ms" }}>Unified MLSys Infrastructure</h2>
        <p className="reveal mt-5 max-w-2xl text-lg text-muted-foreground" style={{ transitionDelay: "160ms" }}>
          One framework from storage to streaming multiprocessor. Four pillars keep the data path short and visible.
        </p>

        <div className="mt-14 grid gap-6 sm:grid-cols-2">
          {pillars.map((p, i) => (
            <article
              key={p.title}
              className="reveal telemetry-card group rounded-xl border border-border bg-card p-8 transition-all duration-300 hover:scale-[1.01] hover:shadow-md hover:border-slate-300"
              style={{ transitionDelay: `${200 + i * 80}ms` }}
            >
              <span className="grid size-10 place-items-center rounded-lg border border-border bg-secondary/60 text-primary transition-colors duration-200 group-hover:border-primary/40 group-hover:bg-primary/10">
                <p.icon className="size-5" />
              </span>
              <h3 className="mt-6 text-lg font-semibold tracking-tight text-foreground">{p.title}</h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">{p.body}</p>
              <p className="mt-6 font-mono text-[11px] text-muted-foreground">{p.tag}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
