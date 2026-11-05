import { LocalStorage } from "@raycast/api";
import { type AgentId, isAgentId } from "./agents";

const STORAGE_KEY = "commit-message-generator.default-agent";
export const FALLBACK_DEFAULT_AGENT: AgentId = "agy";

export async function getSavedDefaultAgent(): Promise<AgentId | undefined> {
  const value = await LocalStorage.getItem<string>(STORAGE_KEY);
  if (value && isAgentId(value)) {
    return value;
  }
  return undefined;
}

export async function setDefaultAgent(agent: AgentId): Promise<void> {
  await LocalStorage.setItem(STORAGE_KEY, agent);
}
