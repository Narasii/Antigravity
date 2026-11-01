export type StreamState = "active" | "paused";

export interface Metrics {
  /** CPU-to-GPU batch latency, ms */
  latency: number;
  /** Zero-copy mmap read bandwidth, GB/s */
  bandwidth: number;
  /** Page-cache hit ratio, % */
  cacheHit: number;
}

export interface PipelineConfig {
  batchSize: number;
  /** Mmap chunk window, MB */
  chunkWindow: number;
  learningRate: number;
}

export interface ControlSpec {
  key: keyof PipelineConfig;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
}

export const controls: ControlSpec[] = [
  { key: "batchSize", label: "Batch Size", unit: "samples", min: 8, max: 1024, step: 8 },
  { key: "chunkWindow", label: "Mmap Chunk Window", unit: "MB", min: 4, max: 256, step: 4 },
  { key: "learningRate", label: "Learning Rate", unit: "", min: 0.00001, max: 0.01, step: 0.00001 },
];

export const defaultConfig: PipelineConfig = { batchSize: 128, chunkWindow: 64, learningRate: 0.0003 };

export const initialMetrics: Metrics = { latency: 0.42, bandwidth: 11.8, cacheHit: 94.2 };

/** Snap a value into a control's range and step. Non-numeric input falls back to the minimum. */
export function clampControl(spec: ControlSpec, value: number): number {
  if (!Number.isFinite(value)) return spec.min;
  const bounded = Math.min(spec.max, Math.max(spec.min, value));
  const snapped = Math.round(bounded / spec.step) * spec.step;
  const decimals = (spec.step.toString().split(".")[1] ?? "").length;
  return Number(Math.min(spec.max, snapped).toFixed(decimals));
}

/** Steady-state targets the live metrics drift around, derived from the applied config. */
export function targetMetrics(config: PipelineConfig): Metrics {
  const bandwidth = 6 + Math.log2(config.chunkWindow) * 1.0; // 64 MB -> 12 GB/s
  const latency = 0.18 + config.batchSize / 530; // 128 -> ~0.42 ms
  const cacheHit = Math.min(99.5, 88 + Math.log2(config.chunkWindow) * 1.05); // 64 MB -> ~94.3%
  return { latency, bandwidth, cacheHit };
}

/** Next live sample. When paused, nothing is read from disk: bandwidth drops to 0 and the rest hold. */
export function nextMetrics(prev: Metrics, config: PipelineConfig, state: StreamState, rand = Math.random): Metrics {
  if (state === "paused") return { ...prev, bandwidth: 0 };
  const t = targetMetrics(config);
  const jitter = (spread: number) => (rand() - 0.5) * 2 * spread;
  return {
    latency: Math.max(0.05, t.latency + jitter(0.04)),
    bandwidth: Math.max(0, t.bandwidth + jitter(0.6)),
    cacheHit: Math.min(99.9, Math.max(0, t.cacheHit + jitter(0.5))),
  };
}

export type LogLevel = "INFO" | "DEBUG" | "WARN";

export interface LogLine {
  id: number;
  time: string;
  level: LogLevel;
  text: string;
}

export const initialLogs: Omit<LogLine, "id">[] = [
  { time: "12:09:58.104", level: "INFO", text: "nsx-kernel 0.4.1 attached to Workstation-01 (2× NUMA, 1× NVMe RAID0)" },
  { time: "12:09:58.311", level: "INFO", text: "mmap buffer allocated at 0x7fff3a2c0000 (64 MiB) — zero-copy bypass active" },
  { time: "12:09:58.402", level: "DEBUG", text: "madvise(MADV_SEQUENTIAL) applied to shard_000..shard_127" },
  { time: "12:09:59.017", level: "INFO", text: "pinned host ring registered with CUDA (cudaHostRegister ok)" },
  { time: "12:09:59.640", level: "DEBUG", text: "Batch #140 ingested in 0.41 ms" },
  { time: "12:10:00.052", level: "DEBUG", text: "Batch #141 ingested in 0.43 ms" },
  { time: "12:10:00.488", level: "DEBUG", text: "Batch #142 ingested in 0.42 ms" },
];

const hex = (rand: () => number) =>
  Math.floor(rand() * 0xffffff)
    .toString(16)
    .padStart(6, "0");

/** A realistic kernel log line for the given batch number and current sample. */
export function streamLog(batch: number, m: Metrics, rand = Math.random): { level: LogLevel; text: string } {
  const roll = rand();
  if (roll < 0.12) return { level: "INFO", text: `mmap window remapped at 0x7fff${hex(rand)}0 — zero-copy bypass active` };
  if (roll < 0.2) return { level: "DEBUG", text: `page cache hit ratio ${m.cacheHit.toFixed(1)}% over last 1k pages` };
  if (roll < 0.25) return { level: "WARN", text: `minor fault burst on shard_${String(Math.floor(rand() * 128)).padStart(3, "0")} (${Math.floor(rand() * 40 + 8)} faults)` };
  return { level: "DEBUG", text: `Batch #${batch} ingested in ${m.latency.toFixed(2)} ms @ ${m.bandwidth.toFixed(1)} GB/s` };
}

export function timestamp(d = new Date()): string {
  const p = (n: number, w = 2) => String(n).padStart(w, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}.${p(d.getMilliseconds(), 3)}`;
}
