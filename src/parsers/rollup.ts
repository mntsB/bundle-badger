import type {
  Asset,
  BuildStats,
  RollupOutputBundle,
  RollupOutputChunk,
  RollupOutputAsset,
} from "./types.js";
import { getAssetType } from "../utils.js";

/**
 * Parse Rollup output bundle into normalized BuildStats
 *
 * This parser handles the output from rollup-plugin-bundle-stats or
 * direct access to Rollup's output bundle object.
 */
export function parseRollupBundle(data: unknown): BuildStats {
  const bundle = data as RollupOutputBundle;

  if (typeof bundle !== "object" || bundle === null) {
    throw new Error("Invalid Rollup bundle: expected an object");
  }

  const assets: Asset[] = [];

  for (const [fileName, output] of Object.entries(bundle)) {
    if (output.type === "chunk") {
      const chunk = output as RollupOutputChunk;

      // Calculate size from code length
      const size = new TextEncoder().encode(chunk.code).length;

      assets.push({
        name: fileName,
        size,
        type: getAssetType(fileName),
        isInitial: chunk.isEntry,
      });
    } else if (output.type === "asset") {
      const asset = output as RollupOutputAsset;

      // Calculate size from source
      let size = 0;
      if (typeof asset.source === "string") {
        size = new TextEncoder().encode(asset.source).length;
      } else if (asset.source instanceof Uint8Array) {
        size = asset.source.length;
      }

      assets.push({
        name: fileName,
        size,
        type: getAssetType(fileName),
        isInitial: false,
      });
    }
  }

  const totalSize = assets.reduce((sum, asset) => sum + asset.size, 0);

  return {
    assets,
    totalSize,
    timestamp: new Date().toISOString(),
    bundler: "rollup",
  };
}

interface RollupStatsEntry {
  size?: number;
  renderedLength?: number;
  isEntry?: boolean;
  isEntrypoint?: boolean;
}

/**
 * Parse Rollup stats with pre-calculated sizes
 *
 * Some Rollup plugins output a simplified stats format with sizes already calculated.
 * This format looks like: { [fileName]: { size: number, ... } }
 */
export function parseRollupStats(data: unknown): BuildStats {
  if (typeof data !== "object" || data === null) {
    throw new Error("Invalid Rollup stats: expected an object");
  }

  const stats = data as Record<string, RollupStatsEntry | number>;
  const assets: Asset[] = [];

  for (const [fileName, fileData] of Object.entries(stats)) {
    // Handle different stats formats
    let size = 0;
    let isEntry = false;

    if (typeof fileData === "object" && fileData !== null) {
      // Format: { size: number, isEntry?: boolean }
      size = fileData.size ?? fileData.renderedLength ?? 0;
      isEntry = fileData.isEntry ?? fileData.isEntrypoint ?? false;
    } else if (typeof fileData === "number") {
      // Format: { [fileName]: size }
      size = fileData;
    }

    // Skip source maps and license files
    const name = fileName.toLowerCase();
    if (name.endsWith(".map") || name.endsWith(".license.txt") || name.endsWith(".license")) {
      continue;
    }

    assets.push({
      name: fileName,
      size,
      type: getAssetType(fileName),
      isInitial: isEntry,
    });
  }

  const totalSize = assets.reduce((sum, asset) => sum + asset.size, 0);

  return {
    assets,
    totalSize,
    timestamp: new Date().toISOString(),
    bundler: "rollup",
  };
}

/**
 * Detect if data is Rollup output bundle format
 */
export function isRollupBundle(data: unknown): boolean {
  if (typeof data !== "object" || data === null) return false;
  if (Array.isArray(data)) return false;

  const bundle = data as Record<string, unknown>;

  // Check if any entry has type 'chunk' or 'asset'
  for (const entry of Object.values(bundle)) {
    if (
      typeof entry === "object" &&
      entry !== null &&
      "type" in entry &&
      (entry.type === "chunk" || entry.type === "asset")
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Detect if data is Rollup stats format (with size metadata)
 */
export function isRollupStats(data: unknown): boolean {
  if (typeof data !== "object" || data === null) return false;
  if (Array.isArray(data)) return false;

  const stats = data as Record<string, unknown>;

  // Rollup stats format detection:
  // - Not webpack (no 'assets' array)
  // - Not vite manifest (no entries with 'file' property)
  // - Has entries with size/renderedLength

  let hasWebpackFormat = false;
  let hasViteFormat = false;
  let hasRollupFormat = false;

  for (const [key, value] of Object.entries(stats)) {
    // Check for webpack
    if (key === "assets" && Array.isArray(value)) {
      hasWebpackFormat = true;
    }

    // Check for vite manifest
    if (
      typeof value === "object" &&
      value !== null &&
      "file" in value
    ) {
      hasViteFormat = true;
    }

    // Check for rollup stats
    if (typeof value === "object" && value !== null) {
      if ("size" in value || "renderedLength" in value) {
        hasRollupFormat = true;
      }
    } else if (typeof value === "number") {
      // Simple format: { [fileName]: size }
      hasRollupFormat = true;
    }
  }

  return hasRollupFormat && !hasWebpackFormat && !hasViteFormat;
}
