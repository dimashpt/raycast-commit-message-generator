import fs from "fs";
import path from "path";
import registry from "../../agent-registry.json";
import { type AgentId, type AgentOption, agentMeta, isAgentId } from "./agents";
import { TOOL_PATH } from "./paths";

export type AgentDefinition = {
  id: AgentId;
  title: string;
  subtitle: string;
  binaries: string[];
  envBin?: string;
  runner: string;
  parse: string;
};

export const AGENT_DEFINITIONS = registry.agents as AgentDefinition[];

function isExecutable(filePath: string): boolean {
  try {
    fs.accessSync(filePath, fs.constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

export function resolveAgentBinary(id: AgentId): string | undefined {
  const def = AGENT_DEFINITIONS.find((a) => a.id === id);
  if (!def) return undefined;

  if (def.envBin) {
    const fromEnv = process.env[def.envBin];
    if (fromEnv && isExecutable(fromEnv)) {
      return fromEnv;
    }
  }

  for (const dir of TOOL_PATH.split(":")) {
    if (!dir) continue;
    for (const bin of def.binaries) {
      const full = path.join(dir, bin);
      if (isExecutable(full)) {
        return full;
      }
    }
  }

  return undefined;
}

export function listInstalledAgents(): AgentOption[] {
  const agents: AgentOption[] = [];

  for (const def of AGENT_DEFINITIONS) {
    const binary = resolveAgentBinary(def.id);
    if (!binary) continue;
    agents.push({
      id: def.id,
      title: def.title,
      subtitle: def.subtitle,
      binary,
    });
  }

  return agents;
}

export function agentDefinition(id: AgentId): AgentDefinition | undefined {
  return AGENT_DEFINITIONS.find((a) => a.id === id);
}

export function assertAgentInstalled(id: AgentId): string {
  const binary = resolveAgentBinary(id);
  if (!binary) {
    const meta = agentMeta(id);
    const def = agentDefinition(id);
    const bins = def?.binaries.join(", ") ?? id;
    throw new Error(`${meta?.title ?? id} CLI not found (looked for: ${bins} on PATH).`);
  }
  return binary;
}

export function pickEffectiveAgent(saved: AgentId | undefined, installed: AgentOption[]): AgentId | undefined {
  if (installed.length === 0) return undefined;
  if (saved && isAgentId(saved) && installed.some((a) => a.id === saved)) return saved;
  return installed[0]?.id;
}
