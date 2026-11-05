import { Clipboard, Toast, closeMainWindow, showToast } from "@raycast/api";
import { recordRepoGenerate } from "./activity";
import type { AgentId } from "./agents";
import { agentLabel } from "./agents";
import { friendlyGenerateError } from "./errors";
import { generateCommitMessage } from "./generate";
import type { RepoEntry } from "./repos";

export async function runGenerate(repo: RepoEntry, agent: AgentId): Promise<void> {
  await closeMainWindow({ clearRootSearch: true });
  await recordRepoGenerate(repo.path);

  const toast = await showToast({
    style: Toast.Style.Animated,
    title: "Generating commit message…",
    message: `${repo.label} · ${agentLabel(agent)}`,
  });

  try {
    const message = await generateCommitMessage(agent, repo.path);
    await Clipboard.copy(message);

    const firstLine = message.split("\n")[0] ?? message;
    toast.style = Toast.Style.Success;
    toast.title = "Copied to clipboard";
    toast.message = firstLine;
  } catch (error) {
    toast.style = Toast.Style.Failure;
    toast.title = "Could not generate commit message";
    toast.message = friendlyGenerateError(error);
  }
}
