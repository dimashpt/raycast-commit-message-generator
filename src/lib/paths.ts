import os from "os";
import path from "path";

/** PATH for child processes (Raycast has a minimal environment). */
export const TOOL_PATH = [
  path.join(os.homedir(), ".local/bin"),
  "/opt/homebrew/bin",
  "/usr/local/bin",
  process.env.PATH ?? "",
]
  .filter(Boolean)
  .join(":");
