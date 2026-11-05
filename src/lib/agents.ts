import registry from "../../agent-registry.json";

export type AgentId = (typeof registry.agents)[number]["id"];

export type AgentOption = {
  id: AgentId;
  title: string;
  subtitle: string;
  binary?: string;
};

export const AGENT_REGISTRY: AgentOption[] = registry.agents.map((a) => ({
  id: a.id as AgentId,
  title: a.title,
  subtitle: a.subtitle,
}));

export function isAgentId(value: string): value is AgentId {
  return AGENT_REGISTRY.some((a) => a.id === value);
}

export function agentLabel(id: AgentId): string {
  return AGENT_REGISTRY.find((a) => a.id === id)?.title ?? id;
}

export function agentMeta(id: AgentId): AgentOption | undefined {
  return AGENT_REGISTRY.find((a) => a.id === id);
}
