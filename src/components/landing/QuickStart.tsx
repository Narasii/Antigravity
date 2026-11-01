import { Check, Copy } from "lucide-react";
import { useState } from "react";
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
    <section id="documentation" className="scroll-mt-20 border-t border-border px-5 py-28">
      <div className="mx-auto grid max-w-6xl gap-14 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Documentation</p>
          <h2 className="mt-4 text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">Stream in three steps.</h2>
          <ol className="mt-10 space-y-6">
            {steps.map((s) => (
              <li key={s.n} className="flex gap-5">
                <span className="font-mono text-sm text-muted-foreground">{s.n}</span>
                <div>
                  <p className="font-medium">{s.title}</p>
                  <p className="mt-1 text-muted-foreground">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-terminal">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <span className="font-mono text-xs text-muted-foreground">quickstart.py</span>
            <button
              onClick={copy}
              className="flex items-center gap-1.5 rounded px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <pre className="overflow-x-auto p-6 font-mono text-[13px] leading-relaxed text-foreground/90">
            <code>{snippet}</code>
          </pre>
        </div>
      </div>
    </section>
  );
}
