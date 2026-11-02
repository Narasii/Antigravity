import { Check, Copy, Code2, Terminal } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface CodeTab {
  id: "python" | "cpp" | "cli";
  label: string;
  filename: string;
  snippet: string;
}

const tabs: CodeTab[] = [
  {
    id: "python",
    label: "Python (PyTorch)",
    filename: "quickstart.py",
    snippet: `# pip install neurostream-x

from neurostream import StreamPipeline
import torch

# Zero-copy memory mapped ring buffer from NVMe straight to GPU
pipe = StreamPipeline(
    "data/shards",
    batch_size=128,
    chunk_window_mb=64,
    pin_memory=True
)

for batch in pipe:
    # Tensors pre-pinned in host RAM -> non-blocking DMA to GPU
    inputs, targets = batch.to("cuda:0", non_blocking=True)
    loss = model(inputs, targets)
    loss.backward()`,
  },
  {
    id: "cpp",
    label: "C++ (CUDA API)",
    filename: "stream_kernel.cu",
    snippet: `#include <neurostream/zero_copy.cuh>

auto loader = nsx::MmapRingLoader::open(
    "/mnt/nvme/shards",
    /*batch_size=*/128,
    /*chunk_window_mb=*/64
);

// Asynchronously stream direct to CUDA stream without host memcpy
while (auto batch = loader.next_stream_batch(cuda_stream)) {
    forward_backward_kernel<<<grid, block, 0, cuda_stream>>>(
        batch.device_ptr(),
        batch.size()
    );
}`,
  },
  {
    id: "cli",
    label: "CLI Benchmark",
    filename: "bash terminal",
    snippet: `# Benchmark storage-to-GPU throughput on local workstation
nsx bench \\
  --shards /mnt/nvme/shards \\
  --batch-size 128 \\
  --chunk-window-mb 64 \\
  --device cuda:0

# [INFO] Pinned ring buffer mapped at 0x7fff3a2c0000
# [INFO] Sustained read throughput: 13.82 GB/s
# [INFO] Average latency per batch: 0.39 ms (zero copies)`,
  },
];

const steps = [
  { n: "01", title: "Install", body: "Python 3.10+ on Linux with a CUDA-capable GPU." },
  { n: "02", title: "Point at your shards", body: "Pre-sharded binary datasets are mapped, not loaded." },
  { n: "03", title: "Stream & observe", body: "Open the live dashboard to watch latency and bandwidth." },
];

export function QuickStart() {
  const [activeTab, setActiveTab] = useState<"python" | "cpp" | "cli">("python");
  const [copied, setCopied] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  const currentTab = tabs.find((t) => t.id === activeTab) ?? tabs[0]!;

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

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(currentTab.snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      toast.success(`${currentTab.label} code snippet copied`);
    } catch {
      toast.error("Couldn't copy — select the text manually");
    }
  };

  return (
    <section id="documentation" className="scroll-mt-20 border-t border-border px-5 py-28" ref={sectionRef}>
      <div className="mx-auto grid max-w-6xl gap-14 lg:grid-cols-[1fr_1.3fr]">
        <div>
          <p className="reveal-left font-mono text-xs uppercase tracking-[0.2em] text-primary">Documentation</p>
          <h2 className="reveal mt-4 text-4xl font-semibold tracking-[-0.03em] sm:text-5xl" style={{ transitionDelay: "80ms" }}>
            Stream in three steps.
          </h2>
          <ol className="mt-10 space-y-6">
            {steps.map((s, i) => (
              <li
                key={s.n}
                className="reveal flex gap-5"
                style={{ transitionDelay: `${160 + i * 80}ms` }}
              >
                <span className="font-mono text-sm text-primary font-bold">{s.n}</span>
                <div>
                  <p className="font-medium text-foreground">{s.title}</p>
                  <p className="mt-1 text-muted-foreground">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* ── Multi-Language Code Box ── */}
        <div
          className="reveal telemetry-card overflow-hidden rounded-xl border border-slate-800 bg-slate-900 text-slate-100 shadow-sm transition-all duration-300 hover:scale-[1.01] hover:shadow-md"
          style={{ transitionDelay: "200ms" }}
        >
          {/* Tabs Bar */}
          <div className="flex flex-wrap items-center justify-between border-b border-slate-800 bg-slate-950/80 px-4 py-2.5">
            <div className="flex items-center gap-1.5">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`rounded-md px-3 py-1.5 text-xs font-mono font-medium transition-colors ${
                    activeTab === tab.id
                      ? "bg-slate-800 text-white shadow-xs"
                      : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden font-mono text-[11px] text-slate-400 sm:inline">
                {currentTab.filename}
              </span>
              <button
                onClick={copy}
                className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
              >
                {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>

          {/* Syntax Code Display */}
          <pre className="overflow-x-auto p-6 font-mono text-[13px] leading-relaxed text-slate-200 min-h-[220px]">
            <code>{currentTab.snippet}</code>
          </pre>
        </div>
      </div>
    </section>
  );
}


