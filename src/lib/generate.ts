import type { AgentId } from "./agents";
import { runAgentPrompt } from "./agent-runner";
import { assertStagedChanges, resolveGitRoot } from "./git-staged";
import { extractCodeBlock, trimCommitMessage } from "./message-utils";
import { buildCommitMessagePrompt } from "./prompt";
import { TOOL_PATH } from "./paths";

export async function generateCommitMessage(agent: AgentId, repoPath: string): Promise<string> {
  const root = resolveGitRoot(repoPath);
  assertStagedChanges(root);

  const prompt = buildCommitMessagePrompt();
  const response = await runAgentPrompt(agent, root, prompt, TOOL_PATH);

  let message = extractCodeBlock(response);
  message = trimCommitMessage(message);

  if (!message.trim()) {
    throw new Error("Model returned an empty commit message.");
  }

  return message;
}
