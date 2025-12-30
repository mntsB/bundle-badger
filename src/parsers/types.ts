/**
 * Normalized asset representation
 */
export interface Asset {
  /** Asset filename */
  name: string;
  /** Size in bytes */
  size: number;
  /** Gzipped size in bytes (optional) */
  gzipSize?: number;
  /** Asset type */
  type: "js" | "css" | "image" | "font" | "other";
  /** Whether this is an entry/initial chunk (vs async/lazy) */
  isInitial: boolean;
}

/**
 * Normalized build statistics
 */
export interface BuildStats {
  /** List of assets */
  assets: Asset[];
  /** Total size of all assets in bytes */
  totalSize: number;
  /** Build timestamp */
  timestamp: string;
  /** Bundler that generated the stats */
  bundler: "webpack" | "vite" | "rollup";
}

/**
 * Webpack stats.json structure (partial)
 */
export interface WebpackStats {
  assets?: WebpackAsset[];
  chunks?: WebpackChunk[];
  entrypoints?: Record<string, WebpackEntrypoint>;
  time?: number;
  builtAt?: number;
  outputPath?: string;
}

export interface WebpackAsset {
  name: string;
  size: number;
  chunks?: (string | number)[];
  chunkNames?: string[];
  emitted?: boolean;
  isOverSizeLimit?: boolean;
}

export interface WebpackChunk {
  id: string | number;
  names?: string[];
  files?: string[];
  initial?: boolean;
  entry?: boolean;
}

export interface WebpackEntrypoint {
  name?: string;
  chunks?: (string | number)[];
  assets?: WebpackEntrypointAsset[];
}

export interface WebpackEntrypointAsset {
  name: string;
  size?: number;
}

/**
 * Vite/Rollup build manifest structure
 */
export interface ViteManifest {
  [key: string]: ViteManifestEntry;
}

export interface ViteManifestEntry {
  file: string;
  src?: string;
  isEntry?: boolean;
  isDynamicEntry?: boolean;
  imports?: string[];
  dynamicImports?: string[];
  css?: string[];
  assets?: string[];
}

/**
 * Rollup output bundle structure
 */
export interface RollupOutputBundle {
  [fileName: string]: RollupOutputChunk | RollupOutputAsset;
}

export interface RollupOutputChunk {
  type: "chunk";
  fileName: string;
  code: string;
  isEntry: boolean;
  isDynamicEntry: boolean;
  facadeModuleId?: string | null;
  imports: string[];
  dynamicImports: string[];
  modules?: Record<string, RollupModule>;
}

export interface RollupOutputAsset {
  type: "asset";
  fileName: string;
  source: string | Uint8Array;
}

export interface RollupModule {
  renderedLength: number;
  originalLength: number;
  code: string | null;
}

/**
 * Parser function type
 */
export type StatsParser = (data: unknown) => BuildStats;
