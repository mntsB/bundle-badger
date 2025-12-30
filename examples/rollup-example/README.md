# Rollup Example with Bundle Badger

This example demonstrates how to use Bundle Badger with a Rollup project.

## Setup

```bash
npm install
```

## Build and Generate Stats

```bash
# Build with stats generation
npm run build

# The rollup-plugin-visualizer generates dist/stats.json automatically
```

## Run Bundle Badger

```bash
# Dry run (prints report to console)
npm run badger

# Or use bundle-badger directly
npx bundle-badger --stats ./dist/stats.json --dry-run
```

## Stats Generation

This example uses `rollup-plugin-visualizer` to generate bundle stats:

```javascript
// rollup.config.js
import { visualizer } from 'rollup-plugin-visualizer';

export default {
  plugins: [
    visualizer({
      filename: 'dist/stats.json',
      json: true,
      gzipSize: true,
    }),
  ],
};
```

The plugin generates a JSON file with detailed bundle information that Bundle Badger can parse.

## Alternative: Custom Stats Plugin

You can also create a custom Rollup plugin to generate stats in a simpler format:

```javascript
function bundleStats() {
  return {
    name: 'bundle-stats',
    generateBundle(options, bundle) {
      const stats = {};

      for (const [fileName, info] of Object.entries(bundle)) {
        if (info.type === 'chunk') {
          stats[fileName] = {
            size: Buffer.byteLength(info.code, 'utf8'),
            isEntry: info.isEntry,
          };
        } else if (info.type === 'asset') {
          stats[fileName] = {
            size: Buffer.byteLength(info.source, 'utf8'),
            isEntry: false,
          };
        }
      }

      this.emitFile({
        type: 'asset',
        fileName: 'stats.json',
        source: JSON.stringify(stats, null, 2),
      });
    },
  };
}
```

## GitLab CI Integration

Add this to your `.gitlab-ci.yml`:

```yaml
bundle-analysis:
  stage: test
  image: node:20
  script:
    - npm ci
    - npm run build
    - npx bundle-badger --stats ./dist/stats.json
  only:
    - merge_requests
  artifacts:
    paths:
      - dist/
```

## With Baseline Comparison

```yaml
bundle-analysis:
  stage: test
  image: node:20
  before_script:
    - npm ci
  script:
    # Build current MR
    - npm run build
    - cp dist/stats.json stats-current.json

    # Build baseline from main
    - git fetch origin main
    - git checkout origin/main
    - npm ci
    - npm run build
    - cp dist/stats.json stats-baseline.json
    - git checkout -

    # Compare with threshold
    - npx bundle-badger --stats ./stats-current.json --baseline ./stats-baseline.json --threshold 5%
  only:
    - merge_requests
```

## Code Splitting

This example demonstrates Rollup's code splitting capabilities:

1. **Manual chunks**: Vendor code is split into a separate chunk
2. **Dynamic imports**: The advanced feature is lazy-loaded
3. **Utility modules**: Helper functions are in separate files

Bundle Badger will track the size of each chunk and alert you to significant changes.

## Expected Output

Bundle Badger will show:
- Entry chunks (main.js)
- Vendor chunks (vendor.js)
- Dynamically imported chunks (advanced.js)
- Size changes compared to baseline
- Visual indicators for increases/decreases
