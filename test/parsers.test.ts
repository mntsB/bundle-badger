import { describe, it, expect } from "vitest";
import { parseWebpackStats, isWebpackStats } from "../src/parsers/webpack.js";
import { parseViteManifest, isViteManifest } from "../src/parsers/vite.js";
import { parseRollupBundle, parseRollupStats, isRollupBundle, isRollupStats } from "../src/parsers/rollup.js";
import { parseStats } from "../src/parsers/index.js";

import webpackStats from "./fixtures/webpack-stats.json";
import viteManifest from "./fixtures/vite-manifest.json";
import rollupBundle from "./fixtures/rollup-bundle.json";
import rollupStats from "./fixtures/rollup-stats.json";

describe("webpack parser", () => {
  it("should detect webpack stats format", () => {
    expect(isWebpackStats(webpackStats)).toBe(true);
    expect(isWebpackStats(viteManifest)).toBe(false);
    expect(isWebpackStats(null)).toBe(false);
    expect(isWebpackStats({})).toBe(false);
  });

  it("should parse webpack stats", () => {
    const result = parseWebpackStats(webpackStats);

    expect(result.bundler).toBe("webpack");
    expect(result.assets).toHaveLength(5); // excludes .map file
    expect(result.timestamp).toBeDefined();
  });

  it("should identify initial chunks", () => {
    const result = parseWebpackStats(webpackStats);

    const mainJs = result.assets.find((a) => a.name === "main.js");
    const vendorJs = result.assets.find((a) => a.name === "vendor.js");
    const lazyJs = result.assets.find((a) => a.name === "lazy-chunk.js");

    expect(mainJs?.isInitial).toBe(true);
    expect(vendorJs?.isInitial).toBe(true);
    expect(lazyJs?.isInitial).toBe(false);
  });

  it("should calculate total size", () => {
    const result = parseWebpackStats(webpackStats);

    // 145920 + 89200 + 12500 + 24680 + 5432 = 277732
    expect(result.totalSize).toBe(277732);
  });

  it("should filter out source maps", () => {
    const result = parseWebpackStats(webpackStats);

    const sourceMap = result.assets.find((a) => a.name.endsWith(".map"));
    expect(sourceMap).toBeUndefined();
  });

  it("should detect asset types", () => {
    const result = parseWebpackStats(webpackStats);

    const mainJs = result.assets.find((a) => a.name === "main.js");
    const stylesCss = result.assets.find((a) => a.name === "styles.css");
    const logoPng = result.assets.find((a) => a.name === "logo.png");

    expect(mainJs?.type).toBe("js");
    expect(stylesCss?.type).toBe("css");
    expect(logoPng?.type).toBe("image");
  });

  it("should throw on invalid stats", () => {
    expect(() => parseWebpackStats({})).toThrow("Invalid webpack stats");
  });
});

describe("vite parser", () => {
  it("should detect vite manifest format", () => {
    expect(isViteManifest(viteManifest)).toBe(true);
    expect(isViteManifest(webpackStats)).toBe(false);
    expect(isViteManifest(null)).toBe(false);
    expect(isViteManifest([])).toBe(false);
  });

  it("should parse vite manifest", () => {
    const result = parseViteManifest(viteManifest);

    expect(result.bundler).toBe("vite");
    expect(result.assets.length).toBeGreaterThan(0);
  });

  it("should identify entry chunks", () => {
    const result = parseViteManifest(viteManifest);

    const indexJs = result.assets.find((a) =>
      a.name.includes("index-abc123.js")
    );
    const aboutJs = result.assets.find((a) => a.name.includes("about"));

    expect(indexJs?.isInitial).toBe(true);
    expect(aboutJs?.isInitial).toBe(false);
  });

  it("should include CSS files", () => {
    const result = parseViteManifest(viteManifest);

    const cssFile = result.assets.find((a) => a.type === "css");
    expect(cssFile).toBeDefined();
    expect(cssFile?.name).toContain("index-def456.css");
  });
});

describe("rollup parser", () => {
  it("should detect rollup bundle format", () => {
    expect(isRollupBundle(rollupBundle)).toBe(true);
    expect(isRollupBundle(webpackStats)).toBe(false);
    expect(isRollupBundle(viteManifest)).toBe(false);
    expect(isRollupBundle(null)).toBe(false);
  });

  it("should detect rollup stats format", () => {
    expect(isRollupStats(rollupStats)).toBe(true);
    expect(isRollupStats(webpackStats)).toBe(false);
    expect(isRollupStats(viteManifest)).toBe(false);
    expect(isRollupStats(null)).toBe(false);
  });

  it("should parse rollup bundle", () => {
    const result = parseRollupBundle(rollupBundle);

    expect(result.bundler).toBe("rollup");
    expect(result.assets.length).toBe(4);
    expect(result.timestamp).toBeDefined();
  });

  it("should parse rollup stats", () => {
    const result = parseRollupStats(rollupStats);

    expect(result.bundler).toBe("rollup");
    expect(result.assets).toHaveLength(4);
    expect(result.totalSize).toBe(219979); // 42500 + 156789 + 8234 + 12456
  });

  it("should identify entry chunks in bundle", () => {
    const result = parseRollupBundle(rollupBundle);

    const indexJs = result.assets.find((a) => a.name === "index.js");
    const vendorJs = result.assets.find((a) => a.name === "vendor.js");

    expect(indexJs?.isInitial).toBe(true);
    expect(vendorJs?.isInitial).toBe(false);
  });

  it("should identify entry chunks in stats", () => {
    const result = parseRollupStats(rollupStats);

    const indexJs = result.assets.find((a) => a.name === "index.js");
    const vendorJs = result.assets.find((a) => a.name === "vendor.js");

    expect(indexJs?.isInitial).toBe(true);
    expect(vendorJs?.isInitial).toBe(false);
  });

  it("should detect asset types", () => {
    const result = parseRollupBundle(rollupBundle);

    const indexJs = result.assets.find((a) => a.name === "index.js");
    const stylesCss = result.assets.find((a) => a.name === "styles.css");
    const logoSvg = result.assets.find((a) => a.name === "logo.svg");

    expect(indexJs?.type).toBe("js");
    expect(stylesCss?.type).toBe("css");
    expect(logoSvg?.type).toBe("image");
  });

  it("should calculate chunk sizes from code", () => {
    const result = parseRollupBundle(rollupBundle);

    const indexJs = result.assets.find((a) => a.name === "index.js");
    expect(indexJs?.size).toBeGreaterThan(0);
  });

  it("should calculate asset sizes from source", () => {
    const result = parseRollupBundle(rollupBundle);

    const stylesCss = result.assets.find((a) => a.name === "styles.css");
    expect(stylesCss?.size).toBeGreaterThan(0);
  });

  it("should throw on invalid bundle", () => {
    expect(() => parseRollupBundle(null)).toThrow("Invalid Rollup bundle");
  });

  it("should throw on invalid stats", () => {
    expect(() => parseRollupStats(null)).toThrow("Invalid Rollup stats");
  });
});

describe("auto-detection", () => {
  it("should auto-detect webpack format", () => {
    const result = parseStats(webpackStats);
    expect(result.bundler).toBe("webpack");
  });

  it("should auto-detect vite format", () => {
    const result = parseStats(viteManifest);
    expect(result.bundler).toBe("vite");
  });

  it("should auto-detect rollup bundle format", () => {
    const result = parseStats(rollupBundle);
    expect(result.bundler).toBe("rollup");
  });

  it("should auto-detect rollup stats format", () => {
    const result = parseStats(rollupStats);
    expect(result.bundler).toBe("rollup");
  });

  it("should throw on unknown format", () => {
    expect(() => parseStats({ unknown: "format" })).toThrow(
      "Could not detect stats format"
    );
  });
});
