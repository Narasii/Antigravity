const names = ["PyTorch", "Linux Kernel", "CUDA", "Ubuntu", "HuggingFace"];

export function TrustBar() {
  const loop = [...names, ...names, ...names, ...names];
  return (
    <section className="border-y border-border py-10" aria-label="Ecosystem integrations">
      <p className="text-center font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
        Built to integrate with the systems stack you already run
      </p>
      <div className="relative mx-auto mt-8 max-w-6xl overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]">
        <ul className="animate-marquee flex w-max items-center gap-16 hover:[animation-play-state:paused]">
          {loop.map((n, i) => (
            <li
              key={i}
              aria-hidden={i >= names.length}
              className="whitespace-nowrap text-xl font-semibold tracking-tight text-muted-foreground/70 transition-colors hover:text-foreground"
            >
              {n}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
