import { describe, it, expect } from "vitest";
import { parseWebpackStats, isWebpackStats } from "../src/parsers/webpack.js";
import { parseViteManifest, isViteManifest } from "../src/parsers/vite.js";
import { parseStats } from "../src/parsers/index.js";

import webpackStats from "./fixtures/webpack-stats.json";
import viteManifest from "./fixtures/vite-manifest.json";

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

describe("auto-detection", () => {
  it("should auto-detect webpack format", () => {
    const result = parseStats(webpackStats);
    expect(result.bundler).toBe("webpack");
  });

  it("should auto-detect vite format", () => {
    const result = parseStats(viteManifest);
    expect(result.bundler).toBe("vite");
  });

  it("should throw on unknown format", () => {
    expect(() => parseStats({ unknown: "format" })).toThrow(
      "Could not detect stats format"
    );
  });
});
