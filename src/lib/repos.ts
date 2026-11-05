import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";
import { REPOS_FILE } from "./paths";

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

export function ensureReposFile(): void {
  const dir = path.dirname(REPOS_FILE);
  fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(REPOS_FILE)) {
    fs.writeFileSync(REPOS_FILE, "# label|/absolute/path\n", "utf8");
  }
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

export function loadRepos(): RepoEntry[] {
  ensureReposFile();

  const entries: RepoEntry[] = [];
  const raw = fs.readFileSync(REPOS_FILE, "utf8");

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

export function appendRepo(label: string, repoPath: string): void {
  ensureReposFile();
  const root = gitRepoRoot(repoPath);
  const normalized = root.replace(/\/$/, "");
  const existing = loadRepos();
  if (existing.some((r) => r.path === normalized)) {
    throw new Error(`Already listed: ${normalized}`);
  }
  const display = label.trim() || path.basename(normalized);
  fs.appendFileSync(REPOS_FILE, `${display}|${normalized}\n`, "utf8");
}

export function appendReposFromFolders(folderPaths: string[]): { added: string[]; errors: string[] } {
  const added: string[] = [];
  const errors: string[] = [];

  for (const folder of folderPaths) {
    try {
      const root = gitRepoRoot(folder);
      const label = path.basename(root);
      appendRepo(label, root);
      added.push(label);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`${folder}: ${message}`);
    }
  }

  return { added, errors };
}

export function removeRepo(label: string): void {
  ensureReposFile();

  const lines = fs.readFileSync(REPOS_FILE, "utf8").split("\n");
  let removed = false;
  const out: string[] = [];

  for (const line of lines) {
    const commentIdx = line.indexOf("#");
    const content = commentIdx >= 0 ? line.slice(0, commentIdx) : line;
    const stripped = trimLine(content);
    if (!stripped) {
      out.push(line);
      continue;
    }

    const entryLabel = stripped.includes("|") ? trimLine(stripped.split("|")[0] ?? "") : trimLine(stripped);
    if (entryLabel === label) {
      removed = true;
      continue;
    }
    out.push(line);
  }

  if (!removed) {
    throw new Error(`Repository not found: ${label}`);
  }

  fs.writeFileSync(REPOS_FILE, out.join("\n").replace(/\n?$/, "\n"), "utf8");
}
