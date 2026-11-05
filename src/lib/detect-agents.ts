import { execFile } from "child_process";
import { promisify } from "util";
import { type AgentId, type AgentOption, agentMeta, isAgentId } from "./agents";
import { GENERATE_BIN, TOOL_PATH } from "./paths";

const execFileAsync = promisify(execFile);

/** Installed agents from `generate-commit-message --list-agents --verbose` (id|title|bin). */
export async function listInstalledAgents(): Promise<AgentOption[]> {
  try {
    const { stdout } = await execFileAsync(
      GENERATE_BIN,
      ["--list-agents", "--verbose"],
      { env: { ...process.env, PATH: TOOL_PATH }, maxBuffer: 1024 * 1024 },
    );

    const agents: AgentOption[] = [];
    for (const line of stdout.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const [id, title, binary] = trimmed.split("|");
      if (!id || !isAgentId(id)) continue;
      const meta = agentMeta(id);
      agents.push({
        id,
        title: title || meta?.title || id,
        subtitle: meta?.subtitle ?? "",
        binary: binary || undefined,
      });
    }
    return agents;
  } catch {
    return [];
  }
}

export function pickEffectiveAgent(saved: AgentId | undefined, installed: AgentOption[]): AgentId | undefined {
  if (installed.length === 0) return undefined;
  if (saved && installed.some((a) => a.id === saved)) return saved;
  return installed[0]?.id;
}
