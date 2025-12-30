const BADGE_MARKER = "🦡 Bundle Badger";

export interface GitHubConfig {
  /** GitHub repository (e.g., owner/repo) */
  repository: string;
  /** Pull Request number */
  prNumber: string;
  /** GitHub token */
  token: string;
  /** GitHub API URL (defaults to api.github.com) */
  apiUrl?: string;
}

export interface GitHubComment {
  id: number;
  body: string;
  user: {
    login: string;
  };
}

/**
 * Get GitHub configuration from environment variables
 */
export function getGitHubConfigFromEnv(): GitHubConfig | null {
  const token = process.env.GITHUB_TOKEN;
  const repository = process.env.GITHUB_REPOSITORY;

  // Extract PR number from GITHUB_REF (e.g., refs/pull/123/merge)
  const ref = process.env.GITHUB_REF || "";
  const prMatch = ref.match(/refs\/pull\/(\d+)\//);
  const prNumber = prMatch ? prMatch[1] : process.env.PR_NUMBER;

  if (!token) {
    return null;
  }

  if (!repository || !prNumber) {
    return null;
  }

  const apiUrl = process.env.GITHUB_API_URL || "https://api.github.com";

  return { repository, prNumber, token, apiUrl };
}

/**
 * Post or update a comment on a GitHub pull request
 */
export async function postPullRequestComment(
  config: GitHubConfig,
  body: string
): Promise<{ commentId: number; updated: boolean }> {
  // First, try to find an existing Bundle Badger comment
  const existingComment = await findExistingComment(config);

  if (existingComment) {
    // Update existing comment
    await updateComment(config, existingComment.id, body);
    return { commentId: existingComment.id, updated: true };
  }

  // Create new comment
  const commentId = await createComment(config, body);
  return { commentId, updated: false };
}

async function findExistingComment(
  config: GitHubConfig
): Promise<GitHubComment | null> {
  const url = `${config.apiUrl}/repos/${config.repository}/issues/${config.prNumber}/comments`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${config.token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch PR comments: ${response.status} ${response.statusText}`
    );
  }

  const comments = (await response.json()) as GitHubComment[];

  // Find a comment containing our marker
  return comments.find((comment) => comment.body.includes(BADGE_MARKER)) ?? null;
}

async function createComment(config: GitHubConfig, body: string): Promise<number> {
  const url = `${config.apiUrl}/repos/${config.repository}/issues/${config.prNumber}/comments`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ body }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Failed to create PR comment: ${response.status} ${response.statusText}\n${errorBody}`
    );
  }

  const comment = (await response.json()) as GitHubComment;
  return comment.id;
}

async function updateComment(
  config: GitHubConfig,
  commentId: number,
  body: string
): Promise<void> {
  const url = `${config.apiUrl}/repos/${config.repository}/issues/comments/${commentId}`;

  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${config.token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ body }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Failed to update PR comment: ${response.status} ${response.statusText}\n${errorBody}`
    );
  }
}

/**
 * Check if running in GitHub Actions environment
 */
export function isGitHubActions(): boolean {
  return process.env.GITHUB_ACTIONS === "true";
}

/**
 * Check if running in a pull request workflow
 */
export function isPullRequestWorkflow(): boolean {
  const eventName = process.env.GITHUB_EVENT_NAME;
  return eventName === "pull_request" || eventName === "pull_request_target";
}
