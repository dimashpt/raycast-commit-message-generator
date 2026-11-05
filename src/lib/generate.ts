import { execFile } from "child_process";
import fs from "fs";
import type { AgentId } from "./agents";
import { friendlyGenerateError } from "./errors";
import { GENERATE_BIN, TOOL_PATH } from "./paths";

export async function generateCommitMessage(agent: AgentId, repoPath: string): Promise<string> {
  if (!fs.existsSync(GENERATE_BIN)) {
    throw new Error("CLI not found");
  }

  return new Promise((resolve, reject) => {
    execFile(
      GENERATE_BIN,
      ["--agent", agent, "--repo", repoPath],
      {
        env: { ...process.env, PATH: TOOL_PATH },
        maxBuffer: 10 * 1024 * 1024,
      },
      (error, stdout, stderr) => {
        if (error) {
          reject(new Error(friendlyGenerateError(error, stderr)));
          return;
        }

        const message = stdout.trim();
        if (!message) {
          reject(new Error(friendlyGenerateError(new Error("empty"), stderr)));
          return;
        }

        resolve(message);
      },
    );
  });
}
