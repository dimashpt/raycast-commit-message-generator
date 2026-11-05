import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";

function expandHome(p: string): string {
  if (p.startsWith("~/")) {
    return path.join(process.env.HOME ?? "", p.slice(2));
  }
  return p;
}

export function resolveGitRoot(repoPath: string): string {
  const resolved = path.resolve(expandHome(repoPath));
  if (!fs.existsSync(resolved)) {
    throw new Error(`Repo path does not exist: ${resolved}`);
  }

  try {
    return execFileSync("git", ["rev-parse", "--show-toplevel"], { cwd: resolved, encoding: "utf8" }).trim();
  } catch {
    throw new Error(`Not a git repository: ${resolved}`);
  }
}

export function assertStagedChanges(repoRoot: string): void {
  try {
    execFileSync("git", ["diff", "--staged", "--quiet"], { cwd: repoRoot });
    throw new Error(`No staged changes in ${path.basename(repoRoot)}. Stage files first (git add).`);
  } catch (error) {
    const status = (error as { status?: number }).status;
    if (status === 1) {
      return;
    }
    throw error;
  }
}
