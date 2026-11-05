import { LocalStorage } from "@raycast/api";
import { execFileSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";

const STORAGE_KEY = "commit-message-generator.repos";
const LEGACY_REPOS_FILE = path.join(os.homedir(), ".config/generate-commit-message/repos.conf");

export type RepoEntry = {
  label: string;
  path: string;
};

function trimLine(line: string): string {
  return line.trim();
}

function expandHome(p: string): string {
  if (p.startsWith("~/")) {
    return `${process.env.HOME ?? ""}${p.slice(1)}`;
  }
  return p;
}

function parseLegacyReposFile(raw: string): RepoEntry[] {
  const entries: RepoEntry[] = [];

  for (const line of raw.split("\n")) {
    const stripped = trimLine(line.split("#")[0] ?? "");
    if (!stripped) continue;

    if (stripped.includes("|")) {
      const pipe = stripped.indexOf("|");
      const label = trimLine(stripped.slice(0, pipe));
      const repoPath = expandHome(trimLine(stripped.slice(pipe + 1)));
      entries.push({ label, path: repoPath });
    } else {
      const repoPath = expandHome(stripped);
      entries.push({ label: repoPath.split("/").pop() ?? repoPath, path: repoPath });
    }
  }

  return entries;
}

function readLegacyReposFile(): RepoEntry[] {
  if (!fs.existsSync(LEGACY_REPOS_FILE)) {
    return [];
  }
  try {
    return parseLegacyReposFile(fs.readFileSync(LEGACY_REPOS_FILE, "utf8"));
  } catch {
    return [];
  }
}

async function saveRepos(entries: RepoEntry[]): Promise<void> {
  await LocalStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

async function migrateLegacyIfNeeded(): Promise<RepoEntry[] | null> {
  const legacy = readLegacyReposFile();
  if (legacy.length === 0) {
    return null;
  }
  await saveRepos(legacy);
  return legacy;
}

export function gitRepoRoot(folderPath: string): string {
  const resolved = path.resolve(expandHome(folderPath));
  if (!fs.existsSync(resolved)) {
    throw new Error(`Path does not exist: ${resolved}`);
  }
  try {
    return execFileSync("git", ["rev-parse", "--show-toplevel"], {
      cwd: resolved,
      encoding: "utf8",
    }).trim();
  } catch {
    throw new Error(`Not a git repository: ${resolved}`);
  }
}

export async function loadRepos(): Promise<RepoEntry[]> {
  const raw = await LocalStorage.getItem<string>(STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as RepoEntry[];
      if (Array.isArray(parsed)) {
        return parsed.filter((e) => e && typeof e.label === "string" && typeof e.path === "string");
      }
    } catch {
      // fall through to migration
    }
  }

  const migrated = await migrateLegacyIfNeeded();
  return migrated ?? [];
}

export async function appendRepo(label: string, repoPath: string): Promise<void> {
  const root = gitRepoRoot(repoPath);
  const normalized = root.replace(/\/$/, "");
  const existing = await loadRepos();
  if (existing.some((r) => r.path === normalized)) {
    throw new Error(`Already listed: ${normalized}`);
  }
  const display = label.trim() || path.basename(normalized);
  await saveRepos([...existing, { label: display, path: normalized }]);
}

export async function appendReposFromFolders(folderPaths: string[]): Promise<{ added: string[]; errors: string[] }> {
  const added: string[] = [];
  const errors: string[] = [];

  for (const folder of folderPaths) {
    try {
      const root = gitRepoRoot(folder);
      const label = path.basename(root);
      await appendRepo(label, root);
      added.push(label);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`${folder}: ${message}`);
    }
  }

  return { added, errors };
}

export async function removeRepo(label: string): Promise<void> {
  const existing = await loadRepos();
  const next = existing.filter((r) => r.label !== label);
  if (next.length === existing.length) {
    throw new Error(`Repository not found: ${label}`);
  }
  await saveRepos(next);
}
