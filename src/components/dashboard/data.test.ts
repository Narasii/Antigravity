import { describe, expect, it } from "vitest";
import { clampControl, controls, defaultConfig, initialMetrics, nextMetrics } from "./data";

const spec = (key: string) => controls.find((c) => c.key === key)!;

describe("pipeline controls", () => {
  it("keeps batch size between 8 and 1024 in steps of 8", () => {
    expect(clampControl(spec("batchSize"), 2000)).toBe(1024);
    expect(clampControl(spec("batchSize"), 1)).toBe(8);
    expect(clampControl(spec("batchSize"), 130)).toBe(128);
  });

  it("keeps the mmap chunk window between 4 and 256 MB", () => {
    expect(clampControl(spec("chunkWindow"), 999)).toBe(256);
    expect(clampControl(spec("chunkWindow"), 0)).toBe(4);
  });
});

describe("stream toggle", () => {
  it("drops bandwidth to zero while paused", () => {
    expect(nextMetrics(initialMetrics, defaultConfig, "paused").bandwidth).toBe(0);
  });

  it("streams non-zero bandwidth while active", () => {
    expect(nextMetrics(initialMetrics, defaultConfig, "active", () => 0.5).bandwidth).toBeGreaterThan(0);
  });
});
