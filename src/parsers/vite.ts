import type { Asset, BuildStats, ViteManifest } from "./types.js";
import { getAssetType } from "../utils.js";

/**
 * Parse Vite manifest.json into normalized BuildStats
 *
 * Note: Vite manifest doesn't include file sizes, so we need to
 * read the actual files. This function expects the manifest to be
 * augmented with sizes or a separate stats object.
 */
export function parseViteManifest(
  data: unknown,
  fileSizes?: Record<string, number>
): BuildStats {
  const manifest = data as ViteManifest;

  if (typeof manifest !== "object" || manifest === null) {
    throw new Error("Invalid Vite manifest: expected an object");
  }

  const assets: Asset[] = [];
  const seen = new Set<string>();

  for (const [, entry] of Object.entries(manifest)) {
    // Add the main file
    if (entry.file && !seen.has(entry.file)) {
      seen.add(entry.file);
      assets.push({
        name: entry.file,
        size: fileSizes?.[entry.file] ?? 0,
        type: getAssetType(entry.file),
        isInitial: entry.isEntry ?? false,
      });
    }

    // Add CSS files
    if (entry.css) {
      for (const cssFile of entry.css) {
        if (!seen.has(cssFile)) {
          seen.add(cssFile);
          assets.push({
            name: cssFile,
            size: fileSizes?.[cssFile] ?? 0,
            type: "css",
            isInitial: entry.isEntry ?? false,
          });
        }
      }
    }

    // Add other assets
    if (entry.assets) {
      for (const assetFile of entry.assets) {
        if (!seen.has(assetFile)) {
          seen.add(assetFile);
          assets.push({
            name: assetFile,
            size: fileSizes?.[assetFile] ?? 0,
            type: getAssetType(assetFile),
            isInitial: false,
          });
        }
      }
    }
  }

  const totalSize = assets.reduce((sum, asset) => sum + asset.size, 0);

  return {
    assets,
    totalSize,
    timestamp: new Date().toISOString(),
    bundler: "vite",
  };
}

/**
 * Parse Vite stats output (from rollup-plugin-visualizer or similar)
 */
export function parseViteStats(data: unknown): BuildStats {
  // Handle rollup-plugin-visualizer JSON output
  if (isVisualizerStats(data)) {
    return parseVisualizerStats(data);
  }

  // Handle standard Vite manifest
  return parseViteManifest(data);
}

interface VisualizerStats {
  children?: VisualizerNode[];
}

interface VisualizerNode {
  name: string;
  value?: number;
  children?: VisualizerNode[];
}

function isVisualizerStats(data: unknown): data is VisualizerStats {
  if (typeof data !== "object" || data === null) return false;
  const stats = data as Record<string, unknown>;
  return Array.isArray(stats.children);
}

function parseVisualizerStats(data: VisualizerStats): BuildStats {
  const assets: Asset[] = [];

  function walk(node: VisualizerNode) {
    // Leaf nodes with values are the actual files
    if (node.value !== undefined && node.value > 0) {
      assets.push({
        name: node.name,
        size: node.value,
        type: getAssetType(node.name),
        isInitial: false,
      });
    }

    if (node.children) {
      for (const child of node.children) {
        walk(child);
      }
    }
  }

  if (data.children) {
    for (const child of data.children) {
      walk(child);
    }
  }

  const totalSize = assets.reduce((sum, asset) => sum + asset.size, 0);

  return {
    assets,
    totalSize,
    timestamp: new Date().toISOString(),
    bundler: "vite",
  };
}

/**
 * Detect if data is Vite manifest format
 */
export function isViteManifest(data: unknown): boolean {
  if (typeof data !== "object" || data === null) return false;
  if (Array.isArray(data)) return false;

  const manifest = data as Record<string, unknown>;

  // Vite manifest entries have 'file' property
  for (const entry of Object.values(manifest)) {
    if (
      typeof entry === "object" &&
      entry !== null &&
      "file" in entry
    ) {
      return true;
    }
  }

  return false;
}
