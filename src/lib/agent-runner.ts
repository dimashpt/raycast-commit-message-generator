import { execFile } from "child_process";
import { promisify } from "util";
import type { AgentId } from "./agents";
import { agentDefinition, assertAgentInstalled } from "./agent-registry";

const execFileAsync = promisify(execFile);

function modelEnv(key: string, fallbackKey?: string): string | undefined {
  const direct = process.env[key]?.trim();
  if (direct) return direct;
  if (fallbackKey) {
    const fb = process.env[fallbackKey]?.trim();
    if (fb) return fb;
  }
  return undefined;
}

function parseJsonResponse(raw: string, parseKind: string): string {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    if (parseKind === "text") return raw;
    throw new Error("Agent returned invalid JSON.");
  }

  const obj = data as Record<string, unknown>;

  switch (parseKind) {
    case "agy": {
      if (obj.status !== "SUCCESS") {
        const err = (obj.error ?? obj.response ?? "Antigravity run failed.") as string;
        throw new Error(String(err));
      }
      return String(obj.response ?? "");
    }
    case "cursor": {
      let response = String(obj.result ?? obj.response ?? obj.text ?? "");
      if (!response.trim()) {
        response = collectStrings(obj).at(-1) ?? "";
      }
      return response;
    }
    case "claude": {
      let response = String(obj.result ?? "");
      if (!response.trim()) {
        response = collectStrings(obj).join("\n");
      }
      return response;
    }
    case "opencode": {
      let response = String(obj.content ?? obj.message ?? obj.text ?? obj.result ?? "");
      if (!response.trim()) {
        response = collectStrings(obj).join("\n");
      }
      return response;
    }
    case "gemini": {
      let response = String(obj.response ?? obj.result ?? obj.text ?? "");
      if (!response.trim()) {
        response = collectStrings(obj).join("\n");
      }
      return response;
    }
    case "copilot": {
      let response = String(obj.result ?? obj.response ?? obj.message ?? "");
      if (!response.trim()) response = raw;
      return response;
    }
    case "text":
      return raw;
    default:
      return raw;
  }
}

function collectStrings(value: unknown): string[] {
  const out: string[] = [];
  const walk = (v: unknown) => {
    if (typeof v === "string") out.push(v);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") Object.values(v).forEach(walk);
  };
  walk(value);
  return out;
}

function buildArgs(def: NonNullable<ReturnType<typeof agentDefinition>>, root: string, prompt: string): string[] {
  switch (def.runner) {
    case "agy": {
      const args = ["-p", prompt, "--dangerously-skip-permissions", "--output-format", "json"];
      const model = modelEnv("GCM_MODEL_AGY", "GENERATE_COMMIT_MESSAGE_MODEL") ?? "gemini-3.8-flash-low";
      if (model) args.push("--model", model);
      return args;
    }
    case "cursor": {
      const args = ["-p", prompt, "--output-format", "json", "--mode", "ask", "--force"];
      const model = modelEnv("GCM_MODEL_CURSOR", "GENERATE_COMMIT_MESSAGE_MODEL_CURSOR");
      if (model) args.push("--model", model);
      return args;
    }
    case "claude": {
      const args = ["-p", prompt, "--output-format", "json", "--add-dir", root, "--dangerously-skip-permissions"];
      const model = modelEnv("GCM_MODEL_CLAUDE", "GENERATE_COMMIT_MESSAGE_MODEL_CLAUDE");
      if (model) args.push("--model", model);
      return args;
    }
    case "opencode": {
      const model = modelEnv("GCM_MODEL_OPENCODE");
      if (model) {
        return ["run", "--format", "json", "--auto", "--standalone", "--model", model, prompt];
      }
      return ["run", "--format", "json", "--auto", "--standalone", prompt];
    }
    case "codex": {
      const model = modelEnv("GCM_MODEL_CODEX");
      if (model) {
        return ["-c", `model="${model}"`, "exec", "--approve-for-me", prompt];
      }
      return ["exec", "--approve-for-me", prompt];
    }
    case "gemini": {
      const args = ["--prompt", prompt, "--yolo", "--output-format", "json"];
      const model = modelEnv("GCM_MODEL_GEMINI");
      if (model) args.push("--model", model);
      return args;
    }
    case "copilot": {
      const args = ["-p", prompt];
      const model = modelEnv("GCM_MODEL_COPILOT");
      if (model) args.push("--model", model);
      return args;
    }
    default:
      throw new Error(`No runner configured for agent: ${def.id}`);
  }
}

export async function runAgentPrompt(
  agent: AgentId,
  repoRoot: string,
  prompt: string,
  pathEnv: string,
): Promise<string> {
  const def = agentDefinition(agent);
  if (!def) {
    throw new Error(`Unknown agent: ${agent}`);
  }

  const binary = assertAgentInstalled(agent);
  const args = buildArgs(def, repoRoot, prompt);

  const { stdout, stderr } = await execFileAsync(binary, args, {
    cwd: repoRoot,
    env: { ...process.env, PATH: pathEnv },
    maxBuffer: 10 * 1024 * 1024,
  });

  const raw = stdout.trim();
  if (!raw) {
    const errText = stderr?.trim();
    throw new Error(errText || "Agent returned an empty response.");
  }

  const response = parseJsonResponse(raw, def.parse);
  if (!response.trim()) {
    throw new Error("Agent returned an empty response.");
  }

  return response;
}
