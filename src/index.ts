import { Command } from "commander";
import chalk from "chalk";
import { parseStats } from "./parsers/index.js";
import { compareBuildStats, createSingleBuildResult } from "./compare.js";
import { generateMarkdownReport, generateJsonReport } from "./report.js";
import {
  getGitLabConfigFromEnv,
  postMergeRequestComment,
  isGitLabCI,
  isMergeRequestPipeline,
} from "./gitlab.js";
import {
  readJsonFile,
  parseThreshold,
  exceedsThreshold,
} from "./utils.js";

const program = new Command();

program
  .name("bundle-badger")
  .description("GitLab-native bundle size tracking tool")
  .version("0.1.0")
  .requiredOption("-s, --stats <path>", "Path to stats JSON file")
  .option("-b, --baseline <path>", "Path to baseline stats JSON file")
  .option(
    "-t, --threshold <value>",
    "Size increase threshold (e.g., 5%, 10kB)"
  )
  .option("-d, --dry-run", "Print report without posting to GitLab")
  .option("-f, --format <type>", "Output format: markdown or json", "markdown")
  .option("--changed-only", "Only show changed files in report")
  .option("--max-assets <number>", "Maximum assets to show in report", "20")
  .action(async (options) => {
    try {
      await run(options);
    } catch (error) {
      console.error(chalk.red("Error:"), (error as Error).message);
      process.exit(1);
    }
  });

interface CLIOptions {
  stats: string;
  baseline?: string;
  threshold?: string;
  dryRun?: boolean;
  format: "markdown" | "json";
  changedOnly?: boolean;
  maxAssets: string;
}

async function run(options: CLIOptions): Promise<void> {
  // Read and parse current stats
  console.log(chalk.blue("Reading stats file:"), options.stats);
  const currentData = await readJsonFile(options.stats);
  const currentStats = parseStats(currentData);
  console.log(
    chalk.green("✓"),
    `Parsed ${currentStats.assets.length} assets from ${currentStats.bundler}`
  );

  // Read and parse baseline if provided
  let baselineStats = null;
  if (options.baseline) {
    console.log(chalk.blue("Reading baseline file:"), options.baseline);
    const baselineData = await readJsonFile(options.baseline);
    baselineStats = parseStats(baselineData);
    console.log(
      chalk.green("✓"),
      `Parsed ${baselineStats.assets.length} assets from baseline`
    );
  }

  // Compare
  const result = baselineStats
    ? compareBuildStats(baselineStats, currentStats)
    : createSingleBuildResult(currentStats);

  // Generate report
  const report =
    options.format === "json"
      ? generateJsonReport(result)
      : generateMarkdownReport(result, {
          changedOnly: options.changedOnly,
          maxAssets: parseInt(options.maxAssets, 10),
        });

  // Check threshold
  let thresholdExceeded = false;
  if (options.threshold && baselineStats) {
    const threshold = parseThreshold(options.threshold);
    if (!threshold) {
      throw new Error(
        `Invalid threshold format: ${options.threshold}. ` +
          `Use percentage (e.g., 5%) or bytes (e.g., 10kB)`
      );
    }

    thresholdExceeded = exceedsThreshold(
      baselineStats.totalSize,
      currentStats.totalSize,
      threshold
    );

    if (thresholdExceeded) {
      console.log(
        chalk.yellow("⚠"),
        `Bundle size increase exceeds threshold of ${options.threshold}`
      );
    }
  }

  // Output or post report
  if (options.dryRun) {
    console.log("");
    console.log(chalk.dim("--- Report Preview ---"));
    console.log(report);
    console.log(chalk.dim("--- End Preview ---"));
    console.log("");
    console.log(chalk.yellow("Dry run mode: not posting to GitLab"));
  } else if (isGitLabCI() && isMergeRequestPipeline()) {
    const config = getGitLabConfigFromEnv();

    if (!config) {
      console.log(chalk.yellow("⚠"), "Missing GitLab configuration:");
      if (!process.env.GITLAB_TOKEN) {
        console.log("  - GITLAB_TOKEN is not set");
      }
      console.log("");
      console.log("Report:");
      console.log(report);
    } else {
      console.log(chalk.blue("Posting report to GitLab MR..."));
      const { noteId, updated } = await postMergeRequestComment(config, report);
      console.log(
        chalk.green("✓"),
        updated ? `Updated comment #${noteId}` : `Created comment #${noteId}`
      );
    }
  } else {
    // Not in GitLab CI or not a MR pipeline - just print the report
    console.log("");
    console.log(report);
  }

  // Exit with error if threshold exceeded
  if (thresholdExceeded) {
    process.exit(1);
  }
}

program.parse();
