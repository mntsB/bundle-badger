import typescript from "@rollup/plugin-typescript";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import { writeFileSync, mkdirSync } from "fs";

/**
 * Plugin to generate bundle stats for bundle-badger
 */
function bundleStats() {
  return {
    name: "bundle-stats",
    generateBundle(options, bundle) {
      const stats = {};

      for (const [fileName, output] of Object.entries(bundle)) {
        if (output.type === "chunk") {
          stats[fileName] = {
            size: Buffer.byteLength(output.code, "utf8"),
            isEntry: output.isEntry,
          };
        } else if (output.type === "asset") {
          const size = typeof output.source === "string"
            ? Buffer.byteLength(output.source, "utf8")
            : output.source.length;
          stats[fileName] = {
            size,
            isEntry: false,
          };
        }
      }

      mkdirSync("dist", { recursive: true });
      writeFileSync("dist/stats.json", JSON.stringify(stats, null, 2));
    },
  };
}

export default {
  input: "src/index.ts",
  output: {
    file: "dist/index.js",
    format: "esm",
    banner: "#!/usr/bin/env node",
    sourcemap: true,
  },
  plugins: [
    resolve(),
    commonjs(),
    typescript({
      tsconfig: "./tsconfig.json",
    }),
    bundleStats(),
  ],
  external: ["commander", "chalk"],
};
