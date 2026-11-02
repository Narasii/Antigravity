import { useState, useMemo } from "react";
import { Calculator, Cpu, Clock, Zap, HardDrive, ArrowUpRight } from "lucide-react";
import { Slider } from "@/components/ui/slider";

interface HardwarePreset {
  id: string;
  name: string;
  pcieGen: string;
  bandwidthCap: number; // GB/s
  baselineBandwidth: number;
  nsxBandwidth: number;
}

const presets: HardwarePreset[] = [
  {
    id: "rtx4090",
    name: "NVIDIA RTX 4090 (PCIe 4.0 ×16)",
    pcieGen: "PCIe 4.0",
    bandwidthCap: 15.5,
    baselineBandwidth: 4.8,
    nsxBandwidth: 13.6,
  },
  {
    id: "a100",
    name: "NVIDIA A100 80GB (PCIe 4.0 / NVLink)",
    pcieGen: "PCIe 4.0",
    bandwidthCap: 24.0,
    baselineBandwidth: 6.2,
    nsxBandwidth: 21.4,
  },
  {
    id: "h100",
    name: "NVIDIA H100 80GB (PCIe 5.0 ×16)",
    pcieGen: "PCIe 5.0",
    bandwidthCap: 48.0,
    baselineBandwidth: 11.5,
    nsxBandwidth: 42.0,
  },
  {
    id: "workstation",
    name: "Dual-Socket Workstation (NVMe RAID0)",
    pcieGen: "PCIe 4.0 NUMA",
    bandwidthCap: 18.0,
    baselineBandwidth: 5.1,
    nsxBandwidth: 15.8,
  },
];

export function HardwareCalculator() {
  const [selectedPresetId, setSelectedPresetId] = useState("rtx4090");
  const [datasetSizeGb, setDatasetSizeGb] = useState(250);
  const [epochs, setEpochs] = useState(5);

  const preset = presets.find((p) => p.id === selectedPresetId) ?? presets[0]!;

  const stats = useMemo(() => {
    const totalDataToStreamGb = datasetSizeGb * epochs;

    // Traditional time in seconds
    const tradSeconds = totalDataToStreamGb / preset.baselineBandwidth;
    // NSX time in seconds
    const nsxSeconds = totalDataToStreamGb / preset.nsxBandwidth;

    const timeSavedSeconds = Math.max(0, tradSeconds - nsxSeconds);
    const speedup = (tradSeconds / nsxSeconds).toFixed(1);

    const tradMinutes = (tradSeconds / 60).toFixed(1);
    const nsxMinutes = (nsxSeconds / 60).toFixed(1);
    const hoursSaved = (timeSavedSeconds / 3600).toFixed(1);
    const ramDuplicationSaved = (datasetSizeGb * 0.8).toFixed(0);

    return {
      tradMinutes,
      nsxMinutes,
      hoursSaved,
      speedup,
      ramDuplicationSaved,
    };
  }, [datasetSizeGb, epochs, preset]);

  return (
    <div className="telemetry-card mt-10 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-secondary/30 px-6 py-4">
        <div className="flex items-center gap-2">
          <Calculator className="size-4 text-primary" />
          <h3 className="font-mono text-sm font-semibold tracking-tight text-foreground">
            Hardware ROI & Training Time Calculator
          </h3>
        </div>
        <span className="font-mono text-xs text-muted-foreground">
          Real-time MLSys Ingestion Model
        </span>
      </div>

      <div className="p-6 md:p-8">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
          {/* Controls */}
          <div className="space-y-6">
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Target Hardware Configuration
              </label>
              <select
                value={selectedPresetId}
                onChange={(e) => setSelectedPresetId(e.target.value)}
                className="mt-2 w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm font-medium text-foreground outline-hidden focus:border-primary focus:ring-1 focus:ring-primary"
              >
                {presets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Dataset size slider */}
            <div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-muted-foreground">Dataset Size</span>
                <span className="font-mono font-bold text-foreground">{datasetSizeGb} GB</span>
              </div>
              <Slider
                className="mt-3"
                value={[datasetSizeGb]}
                onValueChange={([val = 250]) => setDatasetSizeGb(val)}
                min={20}
                max={2000}
                step={10}
              />
              <div className="mt-1 flex justify-between font-mono text-[10px] text-muted-foreground">
                <span>20 GB</span>
                <span>500 GB</span>
                <span>1 TB</span>
                <span>2 TB</span>
              </div>
            </div>

            {/* Epochs slider */}
            <div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-muted-foreground">Training Epochs</span>
                <span className="font-mono font-bold text-foreground">{epochs} Epochs</span>
              </div>
              <Slider
                className="mt-3"
                value={[epochs]}
                onValueChange={([val = 5]) => setEpochs(val)}
                min={1}
                max={20}
                step={1}
              />
              <div className="mt-1 flex justify-between font-mono text-[10px] text-muted-foreground">
                <span>1</span>
                <span>5</span>
                <span>10</span>
                <span>20</span>
              </div>
            </div>
          </div>

          {/* Results Summary Box */}
          <div className="rounded-xl border border-border bg-secondary/30 p-6 flex flex-col justify-between">
            <div>
              <span className="font-mono text-[11px] font-semibold uppercase text-primary tracking-wider">
                Projected Pipeline Advantage
              </span>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="font-mono text-4xl font-bold tracking-tight text-foreground">
                  {stats.speedup}×
                </span>
                <span className="text-sm font-semibold text-emerald-600 flex items-center">
                  faster ingestion <ArrowUpRight className="size-4" />
                </span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                NeuroStream-X completely bypasses host user-space buffering, streaming at{" "}
                <span className="font-mono font-semibold text-foreground">
                  {preset.nsxBandwidth} GB/s
                </span>{" "}
                vs {preset.baselineBandwidth} GB/s.
              </p>
            </div>

            <div className="mt-6 space-y-3 border-t border-border/80 pt-4 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Clock className="size-3.5" /> Total Ingest Time:
                </span>
                <span>
                  <s className="text-muted-foreground mr-1.5">{stats.tradMinutes}m</s>
                  <strong className="text-primary font-bold">{stats.nsxMinutes}m</strong>
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Zap className="size-3.5" /> GPU Waiting Time Saved:
                </span>
                <span className="font-bold text-emerald-600">~{stats.hoursSaved} hrs</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Cpu className="size-3.5" /> Host RAM Duplication Avoided:
                </span>
                <span className="font-medium text-foreground">{stats.ramDuplicationSaved} GB</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
