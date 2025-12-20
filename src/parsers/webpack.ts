import type {
  Asset,
  BuildStats,
  WebpackStats,
  WebpackAsset,
} from "./types.js";
import { getAssetType } from "../utils.js";

/**
 * Parse webpack stats.json into normalized BuildStats
 */
export function parseWebpackStats(data: unknown): BuildStats {
  const stats = data as WebpackStats;

  if (!stats.assets || !Array.isArray(stats.assets)) {
    throw new Error(
      "Invalid webpack stats: missing 'assets' array. " +
        "Ensure stats.json is generated with { assets: true }"
    );
  }

  // Build a map of initial chunks
  const initialChunks = new Set<string | number>();

  if (stats.chunks) {
    for (const chunk of stats.chunks) {
      if (chunk.initial || chunk.entry) {
        initialChunks.add(chunk.id);
      }
    }
  }

  // Also check entrypoints
  if (stats.entrypoints) {
    for (const entrypoint of Object.values(stats.entrypoints)) {
      if (entrypoint.chunks) {
        for (const chunkId of entrypoint.chunks) {
          initialChunks.add(chunkId);
        }
      }
    }
  }

  const assets: Asset[] = stats.assets
    .filter((asset: WebpackAsset) => {
      // Filter out source maps and license files
      const name = asset.name.toLowerCase();
      return (
        !name.endsWith(".map") &&
        !name.endsWith(".license.txt") &&
        !name.endsWith(".license")
      );
    })
    .map((asset: WebpackAsset) => {
      // Determine if asset is initial (entry chunk)
      let isInitial = false;

      if (asset.chunks && asset.chunks.length > 0) {
        isInitial = asset.chunks.some((chunkId) => initialChunks.has(chunkId));
      } else if (asset.chunkNames && asset.chunkNames.length > 0) {
        // Fallback: check if any chunk name suggests entry point
        isInitial = asset.chunkNames.some(
          (name) =>
            name === "main" ||
            name === "app" ||
            name === "index" ||
            name === "vendor"
        );
      }

      return {
        name: asset.name,
        size: asset.size,
        type: getAssetType(asset.name),
        isInitial,
      };
    });

  const totalSize = assets.reduce((sum, asset) => sum + asset.size, 0);

  return {
    assets,
    totalSize,
    timestamp: stats.builtAt
      ? new Date(stats.builtAt).toISOString()
      : new Date().toISOString(),
    bundler: "webpack",
  };
}

/**
 * Detect if data is webpack stats format
 */
export function isWebpackStats(data: unknown): boolean {
  if (typeof data !== "object" || data === null) return false;

  const stats = data as Record<string, unknown>;

  // Webpack stats typically have these properties
  return (
    Array.isArray(stats.assets) ||
    Array.isArray(stats.chunks) ||
    typeof stats.entrypoints === "object"
  );
}
