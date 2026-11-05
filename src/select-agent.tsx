import { Action, ActionPanel, Icon, List, Toast, showToast, useNavigation } from "@raycast/api";
import { usePromise } from "@raycast/utils";
import { AGENTS, agentLabel, type AgentId } from "./lib/agents";
import { getDefaultAgent, setDefaultAgent } from "./lib/preferences";

type SelectAgentViewProps = {
  onChanged: () => void;
};

export function SelectAgentView({ onChanged }: SelectAgentViewProps) {
  const { pop } = useNavigation();
  const { data: current, revalidate } = usePromise(async () => getDefaultAgent(), [], { execute: true });

  async function choose(agent: AgentId) {
    await setDefaultAgent(agent);
    onChanged();
    revalidate();
    await showToast({
      style: Toast.Style.Success,
      title: "Default agent updated",
      message: agentLabel(agent),
    });
    pop();
  }

  return (
    <List isLoading={current === undefined} searchBarPlaceholder="Select default agent">
      {AGENTS.map((agent) => (
        <List.Item
          key={agent.id}
          title={agent.title}
          subtitle={agent.subtitle}
          icon={current === agent.id ? Icon.CheckCircle : Icon.Circle}
          accessories={current === agent.id ? [{ text: "Default", icon: Icon.Stars }] : undefined}
          actions={
            <ActionPanel>
              <Action title="Set as Default" icon={Icon.Stars} onAction={() => choose(agent.id)} />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
