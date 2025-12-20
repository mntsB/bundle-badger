const BADGE_MARKER = "🦡 Bundle Badger";

export interface GitLabConfig {
  /** GitLab API URL (e.g., https://gitlab.com/api/v4) */
  apiUrl: string;
  /** Project ID */
  projectId: string;
  /** Merge Request IID */
  mrIid: string;
  /** Private access token */
  token: string;
}

export interface GitLabNote {
  id: number;
  body: string;
  author: {
    username: string;
  };
}

/**
 * Get GitLab configuration from environment variables
 */
export function getGitLabConfigFromEnv(): GitLabConfig | null {
  const token = process.env.GITLAB_TOKEN;
  const apiUrl = process.env.CI_API_V4_URL;
  const projectId = process.env.CI_PROJECT_ID;
  const mrIid = process.env.CI_MERGE_REQUEST_IID;

  if (!token) {
    return null;
  }

  if (!apiUrl || !projectId || !mrIid) {
    return null;
  }

  return { apiUrl, projectId, mrIid, token };
}

/**
 * Post or update a comment on a GitLab merge request
 */
export async function postMergeRequestComment(
  config: GitLabConfig,
  body: string
): Promise<{ noteId: number; updated: boolean }> {
  // First, try to find an existing Bundle Badger comment
  const existingNote = await findExistingNote(config);

  if (existingNote) {
    // Update existing comment
    await updateNote(config, existingNote.id, body);
    return { noteId: existingNote.id, updated: true };
  }

  // Create new comment
  const noteId = await createNote(config, body);
  return { noteId, updated: false };
}

async function findExistingNote(
  config: GitLabConfig
): Promise<GitLabNote | null> {
  const url = `${config.apiUrl}/projects/${config.projectId}/merge_requests/${config.mrIid}/notes`;

  const response = await fetch(url, {
    headers: {
      "PRIVATE-TOKEN": config.token,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch MR notes: ${response.status} ${response.statusText}`
    );
  }

  const notes = (await response.json()) as GitLabNote[];

  // Find a note containing our marker
  return notes.find((note) => note.body.includes(BADGE_MARKER)) ?? null;
}

async function createNote(config: GitLabConfig, body: string): Promise<number> {
  const url = `${config.apiUrl}/projects/${config.projectId}/merge_requests/${config.mrIid}/notes`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "PRIVATE-TOKEN": config.token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ body }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Failed to create MR note: ${response.status} ${response.statusText}\n${errorBody}`
    );
  }

  const note = (await response.json()) as GitLabNote;
  return note.id;
}

async function updateNote(
  config: GitLabConfig,
  noteId: number,
  body: string
): Promise<void> {
  const url = `${config.apiUrl}/projects/${config.projectId}/merge_requests/${config.mrIid}/notes/${noteId}`;

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "PRIVATE-TOKEN": config.token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ body }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Failed to update MR note: ${response.status} ${response.statusText}\n${errorBody}`
    );
  }
}

/**
 * Check if running in GitLab CI environment
 */
export function isGitLabCI(): boolean {
  return process.env.GITLAB_CI === "true";
}

/**
 * Check if running in a merge request pipeline
 */
export function isMergeRequestPipeline(): boolean {
  return !!process.env.CI_MERGE_REQUEST_IID;
}
