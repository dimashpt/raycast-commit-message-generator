export type AgentId = "agy" | "cursor" | "claude";

export type AgentOption = {
  id: AgentId;
  title: string;
  subtitle: string;
};

export const AGENTS: AgentOption[] = [
  { id: "agy", title: "Antigravity", subtitle: "agy CLI" },
  { id: "cursor", title: "Cursor", subtitle: "cursor-agent --mode ask" },
  { id: "claude", title: "Claude Code", subtitle: "claude -p" },
];

export function agentLabel(id: AgentId): string {
  return AGENTS.find((a) => a.id === id)?.title ?? id;
}
