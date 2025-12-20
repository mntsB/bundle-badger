/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";

  const units = ["B", "kB", "MB", "GB"];
  const k = 1000;
  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
  const unit = units[Math.min(i, units.length - 1)];
  const value = bytes / Math.pow(k, Math.min(i, units.length - 1));

  return `${value.toFixed(value >= 100 ? 0 : value >= 10 ? 1 : 2)} ${unit}`;
}

/**
 * Format percentage with sign
 */
export function formatPercent(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

/**
 * Format size difference with sign
 */
export function formatDiff(bytes: number): string {
  const sign = bytes > 0 ? "+" : "";
  return `${sign}${formatBytes(bytes)}`;
}

/**
 * Determine asset type from filename
 */
export function getAssetType(
  filename: string
): "js" | "css" | "image" | "font" | "other" {
  const ext = filename.split(".").pop()?.toLowerCase() || "";

  if (["js", "mjs", "cjs"].includes(ext)) return "js";
  if (["css", "scss", "sass", "less"].includes(ext)) return "css";
  if (["png", "jpg", "jpeg", "gif", "svg", "webp", "ico"].includes(ext))
    return "image";
  if (["woff", "woff2", "ttf", "otf", "eot"].includes(ext)) return "font";

  return "other";
}

/**
 * Parse threshold string (e.g., "5%", "10kB", "1MB")
 */
export function parseThreshold(
  threshold: string
): { type: "percent" | "bytes"; value: number } | null {
  const percentMatch = threshold.match(/^([\d.]+)%$/);
  if (percentMatch) {
    return { type: "percent", value: parseFloat(percentMatch[1]) };
  }

  const bytesMatch = threshold.match(/^([\d.]+)\s*(B|kB|KB|MB|GB)$/i);
  if (bytesMatch) {
    const value = parseFloat(bytesMatch[1]);
    const unit = bytesMatch[2].toLowerCase();
    const multipliers: Record<string, number> = {
      b: 1,
      kb: 1000,
      mb: 1000 * 1000,
      gb: 1000 * 1000 * 1000,
    };
    return { type: "bytes", value: value * (multipliers[unit] || 1) };
  }

  return null;
}

/**
 * Check if size increase exceeds threshold
 */
export function exceedsThreshold(
  beforeSize: number,
  afterSize: number,
  threshold: { type: "percent" | "bytes"; value: number }
): boolean {
  const diff = afterSize - beforeSize;

  if (diff <= 0) return false;

  if (threshold.type === "percent") {
    const percentIncrease = beforeSize > 0 ? (diff / beforeSize) * 100 : 100;
    return percentIncrease > threshold.value;
  }

  return diff > threshold.value;
}

/**
 * Read file as JSON
 */
export async function readJsonFile<T>(path: string): Promise<T> {
  const fs = await import("fs/promises");

  try {
    const content = await fs.readFile(path, "utf-8");
    return JSON.parse(content) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error(
        `Could not find stats file at ${path}. ` +
          `Make sure your build generates stats.json. ` +
          `For webpack, add: new BundleAnalyzerPlugin({ generateStatsFile: true })`
      );
    }
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in stats file at ${path}: ${error.message}`);
    }
    throw error;
  }
}
