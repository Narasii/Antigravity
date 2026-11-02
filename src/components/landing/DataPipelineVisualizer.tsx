import { useState, useEffect } from "react";
import { HardDrive, Cpu, Zap, ArrowRight, CheckCircle2, AlertTriangle, Layers } from "lucide-react";

/**
 * DataPipelineVisualizer
 * 
 * Interactive MLSys Zero-Copy Pipeline visualizer:
 * Compares NeuroStream-X Zero-Copy DMA Bypass vs Traditional Copy-Based Dataloader.
 * Features animated streaming data packets, interactive node inspector, and memory copy metrics.
 */

interface PipelineNode {
  id: string;
  name: string;
  type: string;
  spec: string;
  icon: typeof HardDrive;
  zeroCopyDesc: string;
  traditionalDesc: string;
  latency: string;
}

const nodes: PipelineNode[] = [
  {
    id: "nvme",
    name: "NVMe Shard Storage",
    type: "Block Storage",
    spec: "PCIe 5.0 ×4 · 14.2 GB/s",
    icon: HardDrive,
    zeroCopyDesc: "Binary dataset shards pre-paged with MADV_SEQUENTIAL. Zero file read syscalls.",
    traditionalDesc: "open() & read() syscalls executed per batch. Disk I/O blocks Python thread.",
    latency: "0.08 ms",
  },
  {
    id: "kernel",
    name: "Kernel Page Cache",
    type: "Virtual Memory",
    spec: "mmap() Direct Ring",
    icon: Layers,
    zeroCopyDesc: "Direct memory-mapping straight into process address space (0x7fff3a2c0000).",
    traditionalDesc: "Kernel reads into page cache, then copies to user-space buffer (Copy #1).",
    latency: "0.02 ms",
  },
  {
    id: "host",
    name: "Pinned Host Ring",
    type: "Host RAM",
    spec: "cudaHostRegister Pinned",
    icon: Cpu,
    zeroCopyDesc: "Memory pages locked in physical RAM. DMA controller can directly access buffer.",
    traditionalDesc: "Python deserializes pickle/tensor into new NumPy array (Copy #2).",
    latency: "0.12 ms",
  },
  {
    id: "gpu",
    name: "GPU Tensor Cores",
    type: "HBM3 / VRAM",
    spec: "Async DMA Stream",
    icon: Zap,
    zeroCopyDesc: "Direct DMA transfer straight into GPU HBM via non-blocking CUDA stream.",
    traditionalDesc: "Synchronous cudaMemcpy blocks PyTorch training loop.",
    latency: "0.18 ms",
  },
];

export function DataPipelineVisualizer() {
  const [mode, setMode] = useState<"zerocopy" | "traditional">("zerocopy");
  const [selectedNode, setSelectedNode] = useState<PipelineNode>(nodes[0]!);
  const [packetOffset, setPacketOffset] = useState(0);

  // Animate streaming packet offsets
  useEffect(() => {
    const timer = setInterval(() => {
      setPacketOffset((prev) => (prev + 1) % 100);
    }, 40);
    return () => clearInterval(timer);
  }, []);

  const isZeroCopy = mode === "zerocopy";

  return (
    <div className="telemetry-card mt-12 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      {/* ── Control Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border bg-secondary/30 px-6 py-4">
        <div className="flex items-center gap-2.5">
          <span className="flex size-2 rounded-full bg-primary" />
          <h3 className="font-mono text-sm font-semibold tracking-tight text-foreground">
            Pipeline Architecture Inspector
          </h3>
          <span className="hidden rounded bg-secondary px-2 py-0.5 font-mono text-[11px] text-muted-foreground sm:inline">
            Interactive Flow
          </span>
        </div>

        {/* Mode Toggle Button */}
        <div className="flex items-center rounded-lg border border-border bg-background p-1 text-xs font-medium">
          <button
            onClick={() => setMode("zerocopy")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-all ${
              isZeroCopy
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <CheckCircle2 className="size-3.5" />
            NeuroStream-X (Zero-Copy)
          </button>
          <button
            onClick={() => setMode("traditional")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-all ${
              !isZeroCopy
                ? "bg-amber-600 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <AlertTriangle className="size-3.5" />
            Traditional PyTorch (2-Copy)
          </button>
        </div>
      </div>

      {/* ── Visual Flow Canvas ── */}
      <div className="p-6 md:p-8">
        <div className="grid gap-4 md:grid-cols-4">
          {nodes.map((node, i) => {
            const isSelected = selectedNode.id === node.id;
            const Icon = node.icon;
            return (
              <div key={node.id} className="relative flex flex-col">
                <button
                  type="button"
                  onClick={() => setSelectedNode(node)}
                  className={`group relative flex flex-1 flex-col rounded-xl border p-5 text-left transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/40"
                      : "border-border bg-card hover:border-slate-300 hover:bg-secondary/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`grid size-9 place-items-center rounded-lg border transition-colors ${
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-secondary text-primary group-hover:border-primary/40"
                      }`}
                    >
                      <Icon className="size-4" />
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      STAGE 0{i + 1}
                    </span>
                  </div>

                  <h4 className="mt-4 font-semibold text-foreground">{node.name}</h4>
                  <p className="mt-1 font-mono text-[11px] text-muted-foreground">{node.spec}</p>

                  <div className="mt-4 flex items-center justify-between border-t border-border/80 pt-3 text-xs">
                    <span className="text-muted-foreground">Hop Latency</span>
                    <span className="font-mono font-medium text-foreground">{node.latency}</span>
                  </div>
                </button>

                {/* Arrow connector between stages */}
                {i < nodes.length - 1 && (
                  <div className="hidden items-center justify-center md:absolute -right-3 top-1/2 -translate-y-1/2 z-10 md:flex">
                    <span className="grid size-6 place-items-center rounded-full border border-border bg-card shadow-xs text-muted-foreground">
                      <ArrowRight className="size-3" />
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Data Packet Stream Animation Track ── */}
        <div className="relative mt-8 overflow-hidden rounded-xl border border-border bg-secondary/30 p-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-3 font-mono">
            <span>DATA TRANSFER BUS (RING BUFFER)</span>
            <span className={isZeroCopy ? "text-primary font-semibold" : "text-amber-600 font-semibold"}>
              {isZeroCopy ? "● ZERO-COPY DIRECT MEMORY STREAM" : "▲ 2 INTERMEDIATE HOST COPIES DETECTED"}
            </span>
          </div>

          <div className="relative h-2 w-full rounded-full bg-border overflow-hidden">
            {/* Animated Stream Pulse */}
            <div
              className={`absolute top-0 bottom-0 w-24 rounded-full blur-xs transition-colors ${
                isZeroCopy ? "bg-primary" : "bg-amber-500"
              }`}
              style={{
                left: `${packetOffset}%`,
                transform: "translateX(-50%)",
              }}
            />
            <div
              className={`absolute top-0 bottom-0 w-8 rounded-full transition-colors ${
                isZeroCopy ? "bg-primary" : "bg-amber-500"
              }`}
              style={{
                left: `${packetOffset}%`,
                transform: "translateX(-50%)",
              }}
            />
          </div>
        </div>

        {/* ── Stage Deep Dive Inspector ── */}
        <div className="mt-6 rounded-xl border border-border bg-secondary/20 p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold uppercase text-primary">
                Selected Stage:
              </span>
              <span className="text-sm font-bold text-foreground">{selectedNode.name}</span>
            </div>
            <span className="font-mono text-xs text-muted-foreground">
              {isZeroCopy ? "Status: Zero-Copy Bypass Active" : "Status: Redundant Buffer Allocation"}
            </span>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 text-sm">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Stage Behavior</p>
              <p className="mt-1 leading-relaxed text-foreground">
                {isZeroCopy ? selectedNode.zeroCopyDesc : selectedNode.traditionalDesc}
              </p>
            </div>
            <div className="rounded-lg border border-border/80 bg-card p-3.5 font-mono text-xs">
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Memory Copies:</span>
                <span className={isZeroCopy ? "font-bold text-emerald-600" : "font-bold text-amber-600"}>
                  {isZeroCopy ? "0 copies (direct mmap)" : "+1 user-space copy"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-t border-border/60">
                <span className="text-muted-foreground">Syscall Overhead:</span>
                <span className="font-medium text-foreground">
                  {isZeroCopy ? "0 (Page-fault pre-pinned)" : "Multiple read() calls"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-t border-border/60">
                <span className="text-muted-foreground">CUDA Synchronous Stalls:</span>
                <span className="font-medium text-foreground">
                  {isZeroCopy ? "None (Stream Pinned)" : "Blocked on Host Thread"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
