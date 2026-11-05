import { Action, ActionPanel, Icon, List, Toast, showToast, useNavigation } from "@raycast/api";
import { usePromise } from "@raycast/utils";
import { type AgentId, agentLabel } from "./lib/agents";
import { listInstalledAgents } from "./lib/detect-agents";
import { getSavedDefaultAgent, setDefaultAgent } from "./lib/preferences";

type SelectAgentViewProps = {
  onChanged: () => void;
};

export function SelectAgentView({ onChanged }: SelectAgentViewProps) {
  const { pop } = useNavigation();
  const {
    data: installed,
    isLoading,
    revalidate: reload,
  } = usePromise(async () => listInstalledAgents(), [], { execute: true });
  const { data: current, revalidate: reloadDefault } = usePromise(async () => getSavedDefaultAgent(), [], {
    execute: true,
  });

  async function choose(agent: AgentId) {
    await setDefaultAgent(agent);
    onChanged();
    reloadDefault();
    reload();
    await showToast({
      style: Toast.Style.Success,
      title: "Default agent updated",
      message: agentLabel(agent),
    });
    pop();
  }

  const agents = installed ?? [];

  return (
    <List isLoading={isLoading || current === undefined} searchBarPlaceholder="Select default agent">
      {agents.length === 0 && !isLoading ? (
        <List.EmptyView
          icon={Icon.Terminal}
          title="No agent CLIs found"
          description="Install agy, cursor-agent, claude, opencode, codex, or gemini and ensure they are on PATH"
        />
      ) : (
        agents.map((agent) => (
          <List.Item
            key={agent.id}
            title={agent.title}
            subtitle={agent.binary ?? agent.subtitle}
            icon={current === agent.id ? Icon.CheckCircle : Icon.Circle}
            accessories={current === agent.id ? [{ text: "Default", icon: Icon.Stars }] : undefined}
            actions={
              <ActionPanel>
                <Action title="Set as Default" icon={Icon.Stars} onAction={() => choose(agent.id)} />
              </ActionPanel>
            }
          />
        ))
      )}
    </List>
  );
}
