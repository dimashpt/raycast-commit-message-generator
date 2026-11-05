import { LocalStorage } from "@raycast/api";
import type { AgentId } from "./agents";

const STORAGE_KEY = "commit-message-generator.default-agent";
const DEFAULT_AGENT: AgentId = "agy";

export async function getDefaultAgent(): Promise<AgentId> {
  const value = await LocalStorage.getItem<string>(STORAGE_KEY);
  if (value === "agy" || value === "cursor" || value === "claude") {
    return value;
  }
  return DEFAULT_AGENT;
}

export async function setDefaultAgent(agent: AgentId): Promise<void> {
  await LocalStorage.setItem(STORAGE_KEY, agent);
}
