export * from "./types.js";
export { parseWebpackStats, isWebpackStats } from "./webpack.js";
export { parseViteManifest, parseViteStats, isViteManifest } from "./vite.js";

import type { BuildStats } from "./types.js";
import { parseWebpackStats, isWebpackStats } from "./webpack.js";
import { parseViteStats, isViteManifest } from "./vite.js";

/**
 * Auto-detect bundler format and parse stats
 */
export function parseStats(data: unknown): BuildStats {
  if (isWebpackStats(data)) {
    return parseWebpackStats(data);
  }

  if (isViteManifest(data)) {
    return parseViteStats(data);
  }

  throw new Error(
    "Could not detect stats format. " +
      "Supported formats: webpack stats.json, vite manifest.json"
  );
}
