import type { Asset, BuildStats } from "./parsers/types.js";

/**
 * Comparison result for a single asset
 */
export interface AssetComparison {
  name: string;
  type: Asset["type"];
  beforeSize: number | null;
  afterSize: number | null;
  diff: number;
  diffPercent: number | null;
  status: "added" | "removed" | "changed" | "unchanged";
}

/**
 * Overall comparison result
 */
export interface ComparisonResult {
  assets: AssetComparison[];
  totalBefore: number;
  totalAfter: number;
  totalDiff: number;
  totalDiffPercent: number;
  addedCount: number;
  removedCount: number;
  changedCount: number;
}

/**
 * Compare two build stats and return the differences
 */
export function compareBuildStats(
  baseline: BuildStats,
  current: BuildStats
): ComparisonResult {
  const beforeMap = new Map<string, Asset>();
  const afterMap = new Map<string, Asset>();

  for (const asset of baseline.assets) {
    beforeMap.set(asset.name, asset);
  }

  for (const asset of current.assets) {
    afterMap.set(asset.name, asset);
  }

  const allNames = new Set([...beforeMap.keys(), ...afterMap.keys()]);
  const assets: AssetComparison[] = [];

  let addedCount = 0;
  let removedCount = 0;
  let changedCount = 0;

  for (const name of allNames) {
    const before = beforeMap.get(name);
    const after = afterMap.get(name);

    const beforeSize = before?.size ?? null;
    const afterSize = after?.size ?? null;

    let diff: number;
    let diffPercent: number | null;
    let status: AssetComparison["status"];

    if (beforeSize === null && afterSize !== null) {
      // New asset
      diff = afterSize;
      diffPercent = null;
      status = "added";
      addedCount++;
    } else if (beforeSize !== null && afterSize === null) {
      // Removed asset
      diff = -beforeSize;
      diffPercent = null;
      status = "removed";
      removedCount++;
    } else if (beforeSize !== null && afterSize !== null) {
      diff = afterSize - beforeSize;
      diffPercent = beforeSize > 0 ? (diff / beforeSize) * 100 : 0;
      status = diff !== 0 ? "changed" : "unchanged";
      if (diff !== 0) changedCount++;
    } else {
      // Should never happen
      continue;
    }

    assets.push({
      name,
      type: (after ?? before)!.type,
      beforeSize,
      afterSize,
      diff,
      diffPercent,
      status,
    });
  }

  // Sort: changes first (by absolute diff), then added, then removed, then unchanged
  assets.sort((a, b) => {
    const statusOrder = { changed: 0, added: 1, removed: 2, unchanged: 3 };
    const statusDiff = statusOrder[a.status] - statusOrder[b.status];
    if (statusDiff !== 0) return statusDiff;

    // Within same status, sort by absolute diff (largest first)
    return Math.abs(b.diff) - Math.abs(a.diff);
  });

  const totalBefore = baseline.totalSize;
  const totalAfter = current.totalSize;
  const totalDiff = totalAfter - totalBefore;
  const totalDiffPercent = totalBefore > 0 ? (totalDiff / totalBefore) * 100 : 0;

  return {
    assets,
    totalBefore,
    totalAfter,
    totalDiff,
    totalDiffPercent,
    addedCount,
    removedCount,
    changedCount,
  };
}

/**
 * Create a comparison result for a single build (no baseline)
 */
export function createSingleBuildResult(stats: BuildStats): ComparisonResult {
  const assets: AssetComparison[] = stats.assets.map((asset) => ({
    name: asset.name,
    type: asset.type,
    beforeSize: null,
    afterSize: asset.size,
    diff: asset.size,
    diffPercent: null,
    status: "added" as const,
  }));

  // Sort by size (largest first)
  assets.sort((a, b) => (b.afterSize ?? 0) - (a.afterSize ?? 0));

  return {
    assets,
    totalBefore: 0,
    totalAfter: stats.totalSize,
    totalDiff: stats.totalSize,
    totalDiffPercent: 0,
    addedCount: assets.length,
    removedCount: 0,
    changedCount: 0,
  };
}
