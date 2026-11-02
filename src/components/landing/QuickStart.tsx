import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const snippet = `pip install neurostream-x

from neurostream import StreamPipeline

pipe = StreamPipeline("data/shards", batch_size=128, chunk_window_mb=64)
for batch in pipe:
    train_step(batch)`;

const steps = [
  { n: "01", title: "Install", body: "Python 3.10+ on Linux with a CUDA-capable GPU." },
  { n: "02", title: "Point at your shards", body: "Pre-sharded binary datasets are mapped, not loaded." },
  { n: "03", title: "Stream & observe", body: "Open the live dashboard to watch latency and bandwidth." },
];

export function QuickStart() {
  const [copied, setCopied] = useState(false);
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

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy — select the text manually");
    }
  };

  return (
    <section id="documentation" className="scroll-mt-20 border-t border-border px-5 py-28" ref={sectionRef}>
      <div className="mx-auto grid max-w-6xl gap-14 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <p className="reveal-left font-mono text-xs uppercase tracking-[0.2em] text-primary">Documentation</p>
          <h2 className="reveal mt-4 text-4xl font-semibold tracking-[-0.03em] sm:text-5xl" style={{ transitionDelay: "80ms" }}>Stream in three steps.</h2>
          <ol className="mt-10 space-y-6">
            {steps.map((s, i) => (
              <li
                key={s.n}
                className="reveal flex gap-5"
                style={{ transitionDelay: `${160 + i * 80}ms` }}
              >
                <span className="font-mono text-sm text-muted-foreground">{s.n}</span>
                <div>
                  <p className="font-medium">{s.title}</p>
                  <p className="mt-1 text-muted-foreground">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div
          className="reveal telemetry-card overflow-hidden rounded-xl border border-slate-800 bg-slate-900 text-slate-100 shadow-sm transition-all duration-300 hover:scale-[1.01] hover:shadow-md"
          style={{ transitionDelay: "200ms" }}
        >
          <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/60 px-5 py-3">
            <span className="font-mono text-xs text-slate-400">quickstart.py</span>
            <button
              onClick={copy}
              className="flex items-center gap-1.5 rounded px-2.5 py-1 text-xs text-slate-300 transition-colors hover:text-white hover:bg-slate-800"
            >
              {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <pre className="overflow-x-auto p-6 font-mono text-[13px] leading-relaxed text-slate-200">
            <code>{snippet}</code>
          </pre>
        </div>
      </div>
    </section>
  );
}

