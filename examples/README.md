# Bundle Badger Examples

This directory contains example projects demonstrating how to use Bundle Badger with different bundlers.

## Available Examples

### [Webpack Example](./webpack-example)
Demonstrates Bundle Badger integration with webpack projects.

**Features:**
- Webpack stats.json generation
- Code splitting with dynamic imports
- GitLab CI configuration examples
- Baseline comparison setup

**Quick Start:**
```bash
cd webpack-example
npm install
npm run build:stats
npm run badger
```

### [Vite Example](./vite-example)
Demonstrates Bundle Badger integration with Vite projects.

**Features:**
- Vite manifest.json support
- Alternative stats with rollup-plugin-visualizer
- Modern ESM setup
- CSS bundling

**Quick Start:**
```bash
cd vite-example
npm install
npm run build
npm run badger
```

### [Rollup Example](./rollup-example)
Demonstrates Bundle Badger integration with Rollup projects.

**Features:**
- Stats generation with rollup-plugin-visualizer
- Manual chunk splitting
- Tree-shaking optimization
- Multiple output formats

**Quick Start:**
```bash
cd rollup-example
npm install
npm run build
npm run badger
```

## Common Usage Patterns

### Local Development

Run Bundle Badger locally to test before pushing:

```bash
# Build your project with stats
npm run build:stats

# Run Bundle Badger in dry-run mode
npx bundle-badger --stats ./stats.json --dry-run
```

### GitLab CI Integration

Basic setup for merge request comments:

```yaml
bundle-analysis:
  stage: test
  image: node:20
  script:
    - npm ci
    - npm run build:stats
    - npx bundle-badger --stats ./stats.json
  only:
    - merge_requests
```

### With Baseline Comparison

Compare against your main branch:

```yaml
bundle-analysis:
  stage: test
  image: node:20
  before_script:
    - npm ci
  script:
    # Build current MR stats
    - npm run build:stats
    - mv stats.json stats-current.json

    # Build baseline stats
    - git fetch origin main
    - git checkout origin/main
    - npm ci
    - npm run build:stats
    - mv stats.json stats-baseline.json
    - git checkout -

    # Compare with threshold
    - npx bundle-badger --stats ./stats-current.json --baseline ./stats-baseline.json --threshold 5%
  only:
    - merge_requests
```

### With Threshold Enforcement

Fail the CI pipeline if bundle size increases too much:

```bash
# Exit code 1 if bundle size increases by more than 5%
npx bundle-badger --stats ./stats.json --baseline ./baseline.json --threshold 5%
```

## Bundle Badger Options

```bash
# Basic usage
bundle-badger --stats ./stats.json

# With baseline comparison
bundle-badger --stats ./stats.json --baseline ./baseline.json

# With threshold (fails if exceeded)
bundle-badger --stats ./stats.json --threshold 10%

# Dry run (no GitLab comment)
bundle-badger --stats ./stats.json --dry-run

# JSON output format
bundle-badger --stats ./stats.json --format json

# Show only changed files
bundle-badger --stats ./stats.json --changed-only

# Limit number of assets shown
bundle-badger --stats ./stats.json --max-assets 10
```

## Environment Variables

When running in GitLab CI, these are auto-detected:

- `GITLAB_TOKEN` - Required for posting MR comments (set in CI/CD settings)
- `CI_API_V4_URL` - Auto-detected
- `CI_PROJECT_ID` - Auto-detected
- `CI_MERGE_REQUEST_IID` - Auto-detected
- `CI_COMMIT_REF_NAME` - Auto-detected

## Supported Stats Formats

Bundle Badger auto-detects and supports:

1. **Webpack** - `stats.json` from `webpack --json`
2. **Vite** - `manifest.json` from build output
3. **Rollup** - Output from `rollup-plugin-visualizer`

## Tips

### Generating Stats

**Webpack:**
```bash
webpack --mode production --json > stats.json
```

**Vite:**
```javascript
// vite.config.js
export default {
  build: {
    manifest: true, // Enables manifest.json
  },
};
```

**Rollup:**
```javascript
// rollup.config.js
import { visualizer } from 'rollup-plugin-visualizer';

export default {
  plugins: [
    visualizer({
      filename: 'stats.json',
      json: true,
    }),
  ],
};
```

### Baseline Storage

For baseline comparison, you can:

1. **Fetch from main branch** (shown in examples above)
2. **Store as artifact** from previous pipeline
3. **Download from S3/storage** if you persist baselines

### Performance Tips

- Use `--changed-only` to focus on modified files
- Set `--max-assets` to limit output size
- Run only on merge requests, not on every commit

## Troubleshooting

### "Could not detect stats format"

Ensure your stats file matches one of the supported formats. Check that:
- Webpack: File contains an `assets` array
- Vite: File contains manifest entries with `file` property
- Rollup: File contains bundle data from visualizer plugin

### "Missing GitLab configuration"

Make sure `GITLAB_TOKEN` environment variable is set in your GitLab CI/CD settings with API access scope.

### Bundle size seems incorrect

Different bundlers report sizes differently:
- Some include source maps (Bundle Badger filters these out)
- Compression (gzip) may not be included
- Check that you're building in production mode

## Further Reading

- [Bundle Badger Documentation](../../README.md)
- [GitLab CI/CD Documentation](https://docs.gitlab.com/ee/ci/)
- [Webpack Stats](https://webpack.js.org/api/stats/)
- [Vite Build Options](https://vitejs.dev/config/build-options.html)
- [Rollup Options](https://rollupjs.org/configuration-options/)
