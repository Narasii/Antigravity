const rows = [
  { metric: "CPU-to-GPU latency (per batch)", baseline: "1.12 ms", nsx: "0.40 ms" },
  { metric: "Sustained read bandwidth", baseline: "4.3 GB/s", nsx: "12.1 GB/s" },
  { metric: "Page-cache hit ratio", baseline: "71.0 %", nsx: "94.5 %" },
  { metric: "Host memory copies per batch", baseline: "2", nsx: "0" },
];

export function Benchmarks() {
  return (
    <section id="benchmarks" className="scroll-mt-20 border-t border-border px-5 py-28">
      <div className="mx-auto max-w-6xl">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Benchmarks</p>
        <h2 className="mt-4 max-w-2xl text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">Fewer copies, shorter paths.</h2>
        <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
          A standard copy-based data loader against NeuroStream-X on a single local workstation.
        </p>

        <div className="mt-14 overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="bg-card text-xs text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-medium">Metric</th>
                <th className="px-6 py-4 font-medium">Copy-based loader</th>
                <th className="px-6 py-4 font-medium text-foreground">NeuroStream-X</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((r) => (
                <tr key={r.metric}>
                  <td className="px-6 py-4">{r.metric}</td>
                  <td className="px-6 py-4 font-mono tabular-nums text-muted-foreground">{r.baseline}</td>
                  <td className="px-6 py-4 font-mono tabular-nums text-primary">{r.nsx}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 font-mono text-[11px] text-muted-foreground">
          Simulated reference profile · replace with measured results before publication.
        </p>
      </div>
    </section>
  );
}
