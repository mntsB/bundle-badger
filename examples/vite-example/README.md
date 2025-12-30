# Vite Example with Bundle Badger

This example demonstrates how to use Bundle Badger with a Vite project.

## Setup

```bash
npm install
```

## Build and Generate Stats

Vite has two ways to generate stats that work with Bundle Badger:

### Option 1: Using Vite Manifest (Built-in)

```bash
npm run build
npm run badger
```

This uses Vite's built-in manifest generation.

### Option 2: Using rollup-plugin-visualizer

```bash
npm run build  # This also generates stats.json via the visualizer plugin
npm run badger:stats
```

This provides more detailed stats including module information.

## GitLab CI Integration

Add this to your `.gitlab-ci.yml`:

```yaml
bundle-analysis:
  stage: test
  image: node:20
  script:
    - npm ci
    - npm run build
    # Option 1: Use manifest.json
    - npx bundle-badger --stats ./dist/.vite/manifest.json
    # Option 2: Use stats from visualizer
    # - npx bundle-badger --stats ./stats.json
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
    - cp dist/.vite/manifest.json manifest-current.json

    # Build baseline from main
    - git fetch origin main
    - git checkout origin/main
    - npm ci
    - npm run build
    - cp dist/.vite/manifest.json manifest-baseline.json
    - git checkout -

    # Compare
    - npx bundle-badger --stats ./manifest-current.json --baseline ./manifest-baseline.json --threshold 10%
  only:
    - merge_requests
```

## Using rollup-plugin-visualizer

The `vite.config.js` includes the visualizer plugin which generates detailed bundle stats:

```javascript
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    visualizer({
      filename: 'stats.json',
      json: true,
      gzipSize: true,
    }),
  ],
});
```

This creates a `stats.json` file that Bundle Badger can parse for detailed analysis.

## Expected Output

Bundle Badger will post a comment to your GitLab MR with a report showing:
- Bundle size changes
- New and removed files
- Size increase/decrease percentages
- Visual indicators for significant changes
