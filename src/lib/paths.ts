import path from "path";
import os from "os";

export const REPOS_FILE = path.join(os.homedir(), ".config/generate-commit-message/repos.conf");

export const GENERATE_BIN = path.join(os.homedir(), ".local/bin/generate-commit-message");

/** PATH for child processes (Raycast has a minimal environment). */
export const TOOL_PATH = [
  path.join(os.homedir(), ".local/bin"),
  "/opt/homebrew/bin",
  "/usr/local/bin",
  process.env.PATH ?? "",
]
  .filter(Boolean)
  .join(":");
