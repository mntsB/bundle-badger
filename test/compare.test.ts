import { describe, it, expect } from "vitest";
import {
  compareBuildStats,
  createSingleBuildResult,
} from "../src/compare.js";
import type { BuildStats } from "../src/parsers/types.js";

describe("compareBuildStats", () => {
  const baseline: BuildStats = {
    assets: [
      { name: "main.js", size: 100000, type: "js", isInitial: true },
      { name: "vendor.js", size: 50000, type: "js", isInitial: true },
      { name: "old.js", size: 10000, type: "js", isInitial: false },
    ],
    totalSize: 160000,
    timestamp: "2024-01-01T00:00:00.000Z",
    bundler: "webpack",
  };

  const current: BuildStats = {
    assets: [
      { name: "main.js", size: 105000, type: "js", isInitial: true },
      { name: "vendor.js", size: 50000, type: "js", isInitial: true },
      { name: "new.js", size: 15000, type: "js", isInitial: false },
    ],
    totalSize: 170000,
    timestamp: "2024-01-02T00:00:00.000Z",
    bundler: "webpack",
  };

  it("should calculate size differences", () => {
    const result = compareBuildStats(baseline, current);

    const mainJs = result.assets.find((a) => a.name === "main.js");
    expect(mainJs?.beforeSize).toBe(100000);
    expect(mainJs?.afterSize).toBe(105000);
    expect(mainJs?.diff).toBe(5000);
    expect(mainJs?.diffPercent).toBe(5);
    expect(mainJs?.status).toBe("changed");
  });

  it("should detect unchanged files", () => {
    const result = compareBuildStats(baseline, current);

    const vendorJs = result.assets.find((a) => a.name === "vendor.js");
    expect(vendorJs?.diff).toBe(0);
    expect(vendorJs?.status).toBe("unchanged");
  });

  it("should detect added files", () => {
    const result = compareBuildStats(baseline, current);

    const newJs = result.assets.find((a) => a.name === "new.js");
    expect(newJs?.beforeSize).toBeNull();
    expect(newJs?.afterSize).toBe(15000);
    expect(newJs?.status).toBe("added");
  });

  it("should detect removed files", () => {
    const result = compareBuildStats(baseline, current);

    const oldJs = result.assets.find((a) => a.name === "old.js");
    expect(oldJs?.beforeSize).toBe(10000);
    expect(oldJs?.afterSize).toBeNull();
    expect(oldJs?.status).toBe("removed");
  });

  it("should calculate totals", () => {
    const result = compareBuildStats(baseline, current);

    expect(result.totalBefore).toBe(160000);
    expect(result.totalAfter).toBe(170000);
    expect(result.totalDiff).toBe(10000);
    expect(result.totalDiffPercent).toBeCloseTo(6.25, 2);
  });

  it("should count changes correctly", () => {
    const result = compareBuildStats(baseline, current);

    expect(result.changedCount).toBe(1); // main.js
    expect(result.addedCount).toBe(1); // new.js
    expect(result.removedCount).toBe(1); // old.js
  });

  it("should sort assets by status and diff", () => {
    const result = compareBuildStats(baseline, current);

    // Changed should come first, then added, then removed, then unchanged
    expect(result.assets[0].status).toBe("changed");
    expect(result.assets[1].status).toBe("added");
    expect(result.assets[2].status).toBe("removed");
    expect(result.assets[3].status).toBe("unchanged");
  });
});

describe("createSingleBuildResult", () => {
  const stats: BuildStats = {
    assets: [
      { name: "main.js", size: 100000, type: "js", isInitial: true },
      { name: "vendor.js", size: 50000, type: "js", isInitial: true },
    ],
    totalSize: 150000,
    timestamp: "2024-01-01T00:00:00.000Z",
    bundler: "webpack",
  };

  it("should mark all assets as added", () => {
    const result = createSingleBuildResult(stats);

    expect(result.assets.every((a) => a.status === "added")).toBe(true);
    expect(result.addedCount).toBe(2);
  });

  it("should have zero baseline", () => {
    const result = createSingleBuildResult(stats);

    expect(result.totalBefore).toBe(0);
    expect(result.totalAfter).toBe(150000);
  });

  it("should sort by size descending", () => {
    const result = createSingleBuildResult(stats);

    expect(result.assets[0].name).toBe("main.js");
    expect(result.assets[1].name).toBe("vendor.js");
  });
});
