import {
  Action,
  ActionPanel,
  Alert,
  Icon,
  Keyboard,
  List,
  Toast,
  confirmAlert,
  showToast,
  useNavigation,
} from "@raycast/api";
import { usePromise } from "@raycast/utils";
import { useMemo, useState } from "react";
import { AddRepositoriesForm } from "./add-repositories";
import { SelectAgentView } from "./select-agent";
import { getRepoActivityMap } from "./lib/activity";
import { agentLabel, type AgentId } from "./lib/agents";
import { listInstalledAgents, pickEffectiveAgent } from "./lib/detect-agents";
import { getSavedDefaultAgent } from "./lib/preferences";
import { runGenerate } from "./lib/run-generate";
import { loadRepos, removeRepo, type RepoEntry } from "./lib/repos";
import { formatAbsoluteTime, formatRelativeTime } from "./lib/time";

/** Shortcut badges may not show on actions inside ActionPanel.Section (Raycast quirk). */
const SHORTCUT_SELECT_AGENT: Keyboard.Shortcut = { modifiers: ["ctrl"], key: "a" };
const SHORTCUT_COPY_PATH: Keyboard.Shortcut = { modifiers: ["cmd"], key: "c" };

function repoItemActions(
  generateTitle: string,
  onGenerate: () => void,
  push: ReturnType<typeof useNavigation>["push"],
  onReposChanged: () => void,
  onAgentChanged: () => void,
  repo: RepoEntry,
  onRemove: () => void,
) {
  return (
    <ActionPanel>
      <ActionPanel.Section>
        <Action title={generateTitle} icon={Icon.Wand} onAction={onGenerate} />
      </ActionPanel.Section>
      <ActionPanel.Section>
        <Action
          title="Add Repositories…"
          icon={Icon.Plus}
          onAction={() => push(<AddRepositoriesForm onAdded={onReposChanged} />)}
        />
        <Action
          title="Select Default Agent…"
          icon={Icon.Stars}
          shortcut={SHORTCUT_SELECT_AGENT}
          onAction={() => push(<SelectAgentView onChanged={onAgentChanged} />)}
        />
        <Action.CopyToClipboard
          title="Copy Repository Path"
          content={repo.path}
          icon={Icon.Folder}
          shortcut={SHORTCUT_COPY_PATH}
        />
      </ActionPanel.Section>
      <ActionPanel.Section>
        <Action
          title="Remove Repository"
          icon={Icon.Trash}
          style={Action.Style.Destructive}
          shortcut={Keyboard.Shortcut.Common.Remove}
          onAction={onRemove}
        />
      </ActionPanel.Section>
    </ActionPanel>
  );
}

function settingsActions(
  push: ReturnType<typeof useNavigation>["push"],
  onReposChanged: () => void,
  onAgentChanged: () => void,
) {
  return (
    <>
      <Action
        title="Add Repositories…"
        icon={Icon.Plus}
        onAction={() => push(<AddRepositoriesForm onAdded={onReposChanged} />)}
      />
      <Action
        title="Select Default Agent…"
        icon={Icon.Stars}
        shortcut={SHORTCUT_SELECT_AGENT}
        onAction={() => push(<SelectAgentView onChanged={onAgentChanged} />)}
      />
    </>
  );
}

function sortRepos(repos: RepoEntry[], activity: Record<string, number>, query: string): RepoEntry[] {
  const q = query.toLowerCase();
  const filtered = repos.filter((r) => r.label.toLowerCase().includes(q) || r.path.toLowerCase().includes(q));

  return filtered.sort((a, b) => {
    const ta = activity[a.path] ?? 0;
    const tb = activity[b.path] ?? 0;
    if (tb !== ta) return tb - ta;
    return a.label.localeCompare(b.label);
  });
}

export default function Command() {
  const { push } = useNavigation();
  const [searchText, setSearchText] = useState("");

  const {
    data: repos,
    isLoading: reposLoading,
    revalidate: reloadRepos,
  } = usePromise(async () => loadRepos(), [], { execute: true });

  const {
    data: activity,
    isLoading: activityLoading,
    revalidate: reloadActivity,
  } = usePromise(async () => getRepoActivityMap(), [], { execute: true });

  const {
    data: savedAgent,
    isLoading: agentLoading,
    revalidate: reloadAgent,
  } = usePromise(async () => getSavedDefaultAgent(), [], { execute: true });

  const {
    data: installedAgents,
    isLoading: installedLoading,
    revalidate: reloadInstalled,
  } = usePromise(async () => listInstalledAgents(), [], { execute: true });

  const isLoading = reposLoading || agentLoading || activityLoading || installedLoading;
  const agent: AgentId | undefined = pickEffectiveAgent(savedAgent, installedAgents ?? []);
  const activityMap = activity ?? {};

  const sortedRepos = useMemo(() => sortRepos(repos ?? [], activityMap, searchText), [repos, activityMap, searchText]);

  const onReposChanged = () => {
    reloadRepos();
  };

  const onAgentChanged = () => {
    reloadAgent();
    reloadInstalled();
  };

  const onGenerate = async (repo: RepoEntry) => {
    if (!agent) {
      await showToast({
        style: Toast.Style.Failure,
        title: "No agent CLI found",
        message: "Install an agent CLI and add it to PATH (⌃A to pick default)",
      });
      return;
    }
    await runGenerate(repo, agent);
    reloadActivity();
  };

  const removeRepository = async (repo: RepoEntry) => {
    const confirmed = await confirmAlert({
      title: `Remove “${repo.label}”?`,
      message: repo.path,
      primaryAction: { title: "Remove", style: Alert.ActionStyle.Destructive },
    });
    if (!confirmed) return;

    try {
      await removeRepo(repo.label);
      await showToast({ style: Toast.Style.Success, title: "Repository removed", message: repo.label });
      onReposChanged();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await showToast({ style: Toast.Style.Failure, title: "Could not remove repository", message });
    }
  };

  const generateTitle = agent ? `Generate with ${agentLabel(agent)}` : "Generate (no agent installed)";

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Search repositories…"
      onSearchTextChange={setSearchText}
      throttle
      navigationTitle="Commit Message Generator"
      actions={<ActionPanel>{settingsActions(push, onReposChanged, onAgentChanged)}</ActionPanel>}
    >
      <List.Section
        title={agent ? `Default agent · ${agentLabel(agent)}` : "No agent CLI on PATH"}
        subtitle={
          agent
            ? "Enter on a repo to generate · sorted by recent activity"
            : "Install agy, cursor-agent, claude, opencode, codex, or gemini"
        }
      >
        {(repos ?? []).length === 0 && !isLoading ? (
          <List.EmptyView
            icon={Icon.Folder}
            title="No repositories yet"
            description="⌘K → Add Repositories to pick git folders"
            actions={
              <ActionPanel>
                <Action
                  title="Add Repositories…"
                  icon={Icon.Plus}
                  onAction={() => push(<AddRepositoriesForm onAdded={onReposChanged} />)}
                />
              </ActionPanel>
            }
          />
        ) : sortedRepos.length === 0 ? (
          <List.Item title="No matching repositories" icon={Icon.MagnifyingGlass} />
        ) : (
          sortedRepos.map((repo) => {
            const lastUsed = activityMap[repo.path];
            return (
              <List.Item
                key={repo.path}
                title={repo.label}
                subtitle={repo.path}
                icon={Icon.Folder}
                accessories={
                  lastUsed
                    ? [
                        {
                          text: formatRelativeTime(lastUsed),
                          tooltip: formatAbsoluteTime(lastUsed),
                        },
                      ]
                    : [{ text: "Never", tooltip: "No commit message generated yet" }]
                }
                actions={repoItemActions(
                  generateTitle,
                  () => onGenerate(repo),
                  push,
                  onReposChanged,
                  onAgentChanged,
                  repo,
                  () => removeRepository(repo),
                )}
              />
            );
          })
        )}
      </List.Section>
    </List>
  );
}
