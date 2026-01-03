# Bundle Badger

[![npm version](https://img.shields.io/npm/v/bundle-badger.svg)](https://www.npmjs.com/package/bundle-badger)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js >= 18](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org/)

A GitLab-native bundle size tracking tool. Runs in GitLab CI, compares bundle sizes between merge requests and baseline, and posts a report as an MR comment.

## Features

- **Auto-detection** - Automatically detects Webpack, Vite, and Rollup output formats
- **Size comparison** - Compare current build against a baseline
- **Threshold enforcement** - Fail CI if bundle size increases beyond a threshold
- **GitLab integration** - Posts/updates MR comments automatically
- **Multiple formats** - Markdown or JSON output

## Installation

```bash
npm install --save-dev bundle-badger
```

Or install globally:

```bash
npm install -g bundle-badger
```

## Quick Start

```bash
# Analyze a stats file
bundle-badger --stats ./dist/stats.json

# Compare against a baseline
bundle-badger --stats ./dist/stats.json --baseline ./baseline/stats.json

# Fail if size increases more than 5%
bundle-badger --stats ./dist/stats.json --threshold 5%

# Dry run (print report, don't post to GitLab)
bundle-badger --stats ./dist/stats.json --dry-run
```

## CLI Options

| Option                    | Description                            |
| ------------------------- | -------------------------------------- |
| `-s, --stats <path>`      | Path to stats JSON file (required)     |
| `-b, --baseline <path>`   | Path to baseline stats for comparison  |
| `-t, --threshold <value>` | Size threshold, e.g. `5%` or `10kB`    |
| `-d, --dry-run`           | Print report without posting to GitLab |
| `-f, --format <type>`     | Output format: `markdown` or `json`    |
| `--changed-only`          | Only show changed files in report      |
| `--max-assets <n>`        | Maximum assets to show (default: 20)   |

## GitLab CI Integration

Add to your `.gitlab-ci.yml`:

```yaml
bundle-report:
  stage: test
  image: node:20
  script:
    - npm ci
    - npm run build
    - npx bundle-badger --stats ./dist/stats.json
  rules:
    - if: $CI_MERGE_REQUEST_IID
```

### With Baseline Comparison

```yaml
bundle-report:
  stage: test
  image: node:20
  script:
    - npm ci
    - npm run build
    # Fetch baseline from main branch artifacts or cache
    - npx bundle-badger --stats ./dist/stats.json --baseline ./baseline/stats.json --threshold 5%
  rules:
    - if: $CI_MERGE_REQUEST_IID
```

### Environment Variables

| Variable               | Description                            | Required      |
| ---------------------- | -------------------------------------- | ------------- |
| `GITLAB_TOKEN`         | Personal access token with `api` scope | Yes           |
| `CI_API_V4_URL`        | GitLab API URL                         | Auto-detected |
| `CI_PROJECT_ID`        | Project ID                             | Auto-detected |
| `CI_MERGE_REQUEST_IID` | MR number                              | Auto-detected |

## Supported Bundlers

### Webpack

Generate stats with [webpack-bundle-analyzer](https://www.npmjs.com/package/webpack-bundle-analyzer):

```javascript
// webpack.config.js
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");

module.exports = {
  plugins: [
    new BundleAnalyzerPlugin({
      analyzerMode: "disabled",
      generateStatsFile: true,
      statsFilename: "stats.json",
    }),
  ],
};
```

Or use webpack's built-in stats:

```bash
webpack --json > stats.json
```

### Vite

Enable manifest generation:

```javascript
// vite.config.js
export default {
  build: {
    manifest: true,
  },
};
```

Then use the manifest file:

```bash
bundle-badger --stats ./dist/.vite/manifest.json
```

For detailed size analysis, use [rollup-plugin-visualizer](https://www.npmjs.com/package/rollup-plugin-visualizer):

```javascript
// vite.config.js
import { visualizer } from "rollup-plugin-visualizer";

export default {
  plugins: [visualizer({ filename: "stats.json", template: "raw-data" })],
};
```

### Rollup

Use [rollup-plugin-visualizer](https://www.npmjs.com/package/rollup-plugin-visualizer):

```javascript
// rollup.config.js
import { visualizer } from "rollup-plugin-visualizer";

export default {
  plugins: [visualizer({ filename: "stats.json", template: "raw-data" })],
};
```

## Report Example

Bundle Badger posts a markdown report to your MR:

```
## Bundle Badger Report

| File        | Before   | After    | Diff                  |
|-------------|----------|----------|-----------------------|
| main.js     | 142.3 kB | 148.7 kB | +6.4 kB (+4.5%) 🔴    |
| vendor.js   | 89.2 kB  | 89.2 kB  | 0 ✅                  |
| styles.css  | -        | 12.1 kB  | +12.1 kB 🆕           |

**Total:** 231.5 kB → 250.0 kB (+18.5 kB / +8.0%)

3 files changed, 1 added
```

### Status Indicators

| Icon | Meaning             |
| ---- | ------------------- |
| 🆕   | New file added      |
| 🗑️   | File removed        |
| ✅   | Unchanged           |
| 🔴   | Size increased >10% |
| 🟠   | Size increased >5%  |
| 🟡   | Small increase      |
| 🟢   | Size decreased      |

## Contributing

```bash
# Clone the repository
git clone https://github.com/mntsB/bundle-badger.git
cd bundle-badger

# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Lint
npm run lint

# Type check
npm run typecheck
```

## License

MIT
